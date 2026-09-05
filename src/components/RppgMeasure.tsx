import React, { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/badge'
import {
  Heart,
  Activity,
  Wind,
  CameraOff,
  RotateCcw,
  AlertTriangle,
  Gauge,
  UploadCloud,
} from 'lucide-react'
import { ApiError } from '@/lib/api'
import {
  getMeasurement,
  getMeasurementResults,
  uploadMeasurement,
  type MeasurementResult,
  type Reading,
} from '@/lib/health-api'
import { useChat } from '../context/ChatContext'

const DURATION = 30 // detik
const POLL_INTERVAL = 2000
const POLL_TIMEOUT = 60000

/**
 * idle → recording → recorded (rekaman siap ditinjau) → uploading → processing → done | failed
 * Perekaman dan pengunggahan sengaja dipisah supaya pengguna bisa merekam
 * ulang sebelum mengirim, dan kegagalan unggah tidak menghapus rekamannya.
 */
type Phase = 'idle' | 'recording' | 'recorded' | 'uploading' | 'processing' | 'done' | 'failed'

// Chrome merekam webm, Safari mp4. Kontrak menyebut mp4/mov, jadi mp4
// diprioritaskan dan webm dipakai kalau browser tidak mendukungnya.
const CANDIDATE_TYPES = [
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=h264',
  'video/webm;codecs=vp9',
  'video/webm',
]

const pickMimeType = () => CANDIDATE_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''

const extensionFor = (mimeType: string) => (mimeType.includes('mp4') ? 'mp4' : 'webm')

const METRIC_LABELS: Record<
  string,
  { label: string; icon: typeof Heart; bg: string; ring: string; fg: string }
> = {
  heart_rate: {
    label: 'Detak Jantung',
    icon: Heart,
    bg: 'bg-rose-50',
    ring: 'border-rose-100/80',
    fg: 'text-rose-500',
  },
  hrv_rmssd: {
    label: 'Variabilitas (HRV)',
    icon: Activity,
    bg: 'bg-sage-50',
    ring: 'border-sage-100/80',
    fg: 'text-sage-600',
  },
  respiration_rate: {
    label: 'Laju Pernapasan',
    icon: Wind,
    bg: 'bg-clay-50',
    ring: 'border-clay-100/80',
    fg: 'text-clay-600',
  },
}

// Metrik baru bisa ditambahkan tanpa perubahan API, jadi yang tidak dikenal
// tetap dirender apa adanya.
const describeMetric = (metricType: string) =>
  METRIC_LABELS[metricType] ?? {
    label: metricType.replace(/_/g, ' '),
    icon: Gauge,
    bg: 'bg-ink-100',
    ring: 'border-ink-200/80',
    fg: 'text-ink-600',
  }

const QUALITY_LABELS: Record<string, string> = {
  good: 'Baik',
  fair: 'Cukup',
  poor: 'Kurang',
  rejected: 'Ditolak',
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const RppgMeasure: React.FC = () => {
  const { addAiMessage } = useChat()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number>(0)
  const cancelledRef = useRef(false)

  const [cameraError, setCameraError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [recording, setRecording] = useState<{ blob: Blob; mimeType: string; url: string } | null>(
    null
  )
  const [result, setResult] = useState<MeasurementResult | null>(null)

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
        setReady(true)
      })
      .catch((e: Error) => setCameraError(e.message || 'Kamera tidak dapat diakses'))

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  // StrictMode memasang efek dua kali (mount → cleanup → mount), jadi flag ini
  // harus dinyalakan ulang saat mount. Tanpa itu, cleanup pertama membuatnya
  // permanen true dan polling berhenti sebelum request pertama.
  useEffect(() => {
    cancelledRef.current = false
    return () => {
      cancelledRef.current = true
      window.clearInterval(timerRef.current)
    }
  }, [])

  // Object URL pratinjau dilepas begitu rekamannya diganti atau komponen tutup.
  useEffect(() => {
    if (!recording) return
    return () => URL.revokeObjectURL(recording.url)
  }, [recording])

  const stopRecording = () => {
    window.clearInterval(timerRef.current)
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  }

  const startRecording = () => {
    const stream = streamRef.current
    if (!stream) return

    const mimeType = pickMimeType()
    if (!mimeType) {
      setPhase('failed')
      setMessage('Browser ini tidak mendukung perekaman video.')
      return
    }

    chunksRef.current = []
    setRecording(null)
    setResult(null)
    setMessage(null)
    setElapsed(0)
    setPhase('recording')

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      window.clearInterval(timerRef.current)
      const blob = new Blob(chunksRef.current, { type: mimeType })
      setRecording({ blob, mimeType, url: URL.createObjectURL(blob) })
      setPhase('recorded')
    }
    recorder.start()

    const startedAt = Date.now()
    timerRef.current = window.setInterval(() => {
      const seconds = (Date.now() - startedAt) / 1000
      setElapsed(seconds)
      if (seconds >= DURATION) stopRecording()
    }, 200)
  }

  /** Cek status tiap 2 detik sampai selesai, gagal, atau lewat 60 detik. */
  const pollUntilReady = async (sessionId: string) => {
    const deadline = Date.now() + POLL_TIMEOUT
    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL)
      if (cancelledRef.current) return
      const session = await getMeasurement(sessionId)

      if (session.processing_status === 'completed') {
        const results = await getMeasurementResults(sessionId)
        if (cancelledRef.current) return
        setResult(results)
        setPhase('done')

        if (results.signal_quality_flag === 'rejected') {
          setMessage('Kualitas sinyal terlalu rendah untuk dipercaya. Silakan rekam ulang.')
          return
        }
        const summary = results.readings
          .map((r) =>
            `${describeMetric(r.metric_type).label} ${Math.round(r.value)} ${r.unit ?? ''}`.trim()
          )
          .join(', ')
        addAiMessage(`Pengukuran rPPG selesai. ${summary}.`, true)
        return
      }

      if (session.processing_status === 'failed') {
        setPhase('failed')
        setMessage('Server gagal memproses rekaman ini. Coba rekam ulang dengan cahaya lebih baik.')
        return
      }
    }

    setPhase('failed')
    setMessage('Pemrosesan memakan waktu terlalu lama. Coba unggah ulang.')
  }

  const upload = async () => {
    if (!recording) return
    setPhase('uploading')
    setMessage(null)
    try {
      const { session_id } = await uploadMeasurement(
        recording.blob,
        `rppg-${Date.now()}.${extensionFor(recording.mimeType)}`
      )
      setPhase('processing')
      await pollUntilReady(session_id)
    } catch (error) {
      // Rekaman sengaja dipertahankan supaya bisa dicoba unggah lagi.
      setPhase('recorded')
      setMessage(error instanceof ApiError ? error.message : 'Gagal mengirim rekaman ke server')
    }
  }

  const isBusy = phase === 'uploading' || phase === 'processing'
  const progress =
    phase === 'recording' ? Math.min(1, elapsed / DURATION) : phase === 'idle' ? 0 : 1
  const rejected = result?.signal_quality_flag === 'rejected'
  const qualityPercent =
    result?.signal_quality_score != null ? Math.round(result.signal_quality_score * 100) : null
  const showPreview = recording !== null && phase !== 'recording'

  const statusText = () => {
    if (phase === 'recording') return 'Merekam wajah…'
    if (phase === 'recorded') return 'Rekaman siap. Tinjau lalu unggah untuk dianalisis.'
    if (phase === 'uploading') return 'Mengunggah rekaman…'
    if (phase === 'processing') return 'Server sedang menganalisis sinyal mikrovaskular…'
    if (phase === 'done') return rejected ? 'Sinyal ditolak' : 'Pengukuran selesai'
    if (phase === 'failed') return 'Pengukuran gagal'
    return `Tekan tombol rekam untuk mulai (${DURATION} detik)`
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
            Ukur rPPG
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            Rekam wajah selama {DURATION} detik, lalu unggah untuk dianalisis server.
          </p>
        </div>
        <Chip
          size="sm"
          color={cameraError ? 'warning' : ready ? 'success' : 'neutral'}
          variant="soft"
          className="font-semibold text-xs self-start sm:self-auto"
        >
          ● {cameraError ? 'Kamera Nonaktif' : ready ? 'Kamera Aktif' : 'Menyiapkan Kamera…'}
        </Chip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* VIEWFINDER / PRATINJAU + KONTROL */}
        <Card className="lg:col-span-8 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-ink-200/80 shadow-xs space-y-5">
          <div className="relative w-full aspect-4/3 bg-ink-950 rounded-2xl overflow-hidden border border-ink-800">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
                <CameraOff className="w-7 h-7 text-ink-500" />
                <span className="text-sm font-bold text-ink-200">Kamera tidak dapat diakses</span>
                <p className="text-xs text-ink-400 max-w-xs">
                  Izinkan akses kamera di browser lalu muat ulang halaman. ({cameraError})
                </p>
              </div>
            ) : showPreview ? (
              <video
                key={recording.url}
                src={recording.url}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover -scale-x-100"
              />
            )}

            {/* Bingkai oval hanya relevan saat membidik, bukan saat meninjau */}
            {!showPreview && !cameraError && (
              <div className="absolute inset-0 flex items-start justify-center pt-[12%] pointer-events-none">
                <div
                  className={`w-[38%] aspect-3/4 border-2 border-dashed rounded-[50%] transition-colors ${
                    phase === 'recording' ? 'border-emerald-400' : 'border-clay-400/70 animate-pulse'
                  }`}
                />
              </div>
            )}

            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] text-emerald-400 font-mono">
              <span
                className={`w-2 h-2 rounded-full bg-emerald-400 ${
                  phase === 'recording' ? 'animate-pulse' : ''
                }`}
              />
              {phase === 'recording'
                ? `${Math.floor(elapsed)}s / ${DURATION}s`
                : showPreview
                ? 'Pratinjau'
                : 'Siap'}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-ink-600">
              <span>{statusText()}</span>
              <span className="text-clay-700 font-mono font-bold">
                {isBusy ? '…' : `${Math.round(progress * 100)}%`}
              </span>
            </div>
            <div className="w-full bg-ink-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-200 ${
                  isBusy ? 'bg-clay-400 animate-pulse' : 'bg-clay-700'
                }`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {message && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {/* KONTROL */}
          <div className="flex flex-col items-center gap-3 pt-1">
            <button
              type="button"
              onClick={phase === 'recording' ? stopRecording : startRecording}
              disabled={!ready || isBusy}
              aria-label={phase === 'recording' ? 'Hentikan rekaman' : 'Mulai rekam'}
              className="w-20 h-20 rounded-3xl bg-white border-2 border-ink-300 flex items-center justify-center shadow-xs transition hover:border-rose-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span
                className={`bg-rose-600 transition-all ${
                  phase === 'recording' ? 'w-6 h-6 rounded-md' : 'w-11 h-11 rounded-full'
                }`}
              />
            </button>

            <span className="text-xs font-semibold text-ink-500">
              {phase === 'recording'
                ? 'Ketuk untuk berhenti lebih awal'
                : isBusy
                ? 'Menunggu hasil dari server'
                : recording
                ? 'Rekam ulang'
                : `Rekam ${DURATION} detik`}
            </span>

            {recording && !isBusy && phase !== 'done' && (
              <Button
                size="sm"
                onClick={() => void upload()}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-ink-900 hover:bg-ink-800 text-white shadow-xs cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-clay-300" />
                Unggah & Analisis
              </Button>
            )}
          </div>
        </Card>

        {/* HASIL */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-ink-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-ink-100">
              <h3 className="text-sm font-bold text-ink-900 tracking-tight">Hasil Pengukuran</h3>
              {(phase === 'done' || phase === 'failed') && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={startRecording}
                  disabled={!ready}
                  className="text-xs font-semibold text-ink-600 rounded-full cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Rekam Ulang
                </Button>
              )}
            </div>

            {!result ? (
              <p className="text-xs text-ink-500 py-6 text-center">
                {isBusy
                  ? 'Menunggu hasil analisis server…'
                  : phase === 'recorded'
                  ? 'Rekaman belum diunggah. Tekan "Unggah & Analisis" untuk mendapatkan hasil.'
                  : 'Belum ada hasil. Rekam dengan pencahayaan yang cukup dan wajah tidak tertutup.'}
              </p>
            ) : rejected ? (
              // Kontrak: jangan tampilkan angka apa pun kalau sinyalnya ditolak.
              <div className="py-6 text-center space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="text-xs text-ink-600">
                  Sinyal tidak cukup andal untuk ditampilkan. Rekam ulang dengan cahaya merata dan
                  tanpa banyak gerakan.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.readings.map((reading: Reading) => {
                  const meta = describeMetric(reading.metric_type)
                  return (
                    <div key={reading.metric_type} className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl ${meta.bg} border ${meta.ring} flex items-center justify-center ${meta.fg} shrink-0`}
                      >
                        <meta.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold text-ink-500 block capitalize">
                          {meta.label}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-extrabold text-ink-900 tracking-tight leading-none">
                            {Math.round(reading.value)}
                          </span>
                          <span className="text-xs font-semibold text-ink-400 uppercase">
                            {reading.unit ?? ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}

                <div className="pt-3 border-t border-ink-100 flex items-center justify-between text-xs">
                  <span className="text-ink-500 font-medium">Kualitas Sinyal</span>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={result.signal_quality_flag === 'good' ? 'success' : 'warning'}
                    className="font-bold text-[10px]"
                  >
                    {QUALITY_LABELS[result.signal_quality_flag ?? ''] ?? 'Tidak diketahui'}
                    {qualityPercent !== null ? ` · ${qualityPercent}%` : ''}
                  </Chip>
                </div>
              </div>
            )}

            {result?.disclaimer && (
              <p className="text-[11px] text-ink-400 leading-relaxed pt-3 border-t border-ink-100">
                {result.disclaimer}
              </p>
            )}
          </Card>

          <Card className="p-5 rounded-2xl bg-ink-50/70 border border-ink-200/80 shadow-none space-y-2">
            <h4 className="text-xs font-bold text-ink-800">Tips Pengukuran</h4>
            <ul className="text-xs text-ink-600 space-y-1.5 list-disc pl-4">
              <li>Cahaya merata di wajah, hindari backlight dari jendela.</li>
              <li>Duduk diam dan bernapas normal selama perekaman.</li>
              <li>Lepas masker atau apapun yang menutupi dahi dan pipi.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RppgMeasure
