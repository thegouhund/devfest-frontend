import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Heart,
  Activity,
  Wind,
  CameraOff,
  RotateCcw,
  AlertTriangle,
  Gauge,
  UploadCloud,
  Loader2,
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

const DURATION = 20 // detik
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
  const [recording, setRecording] = useState<{ blob: Blob; mimeType: string } | null>(null)
  const [result, setResult] = useState<MeasurementResult | null>(null)
  /** Popup hasil bisa ditutup tanpa membuang rekaman/hasilnya. */
  const [showResult, setShowResult] = useState(false)

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
      setShowResult(true)
      return
    }

    chunksRef.current = []
    setRecording(null)
    setResult(null)
    setMessage(null)
    setElapsed(0)
    setShowResult(false)
    setPhase('recording')

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      window.clearInterval(timerRef.current)
      setRecording({ blob: new Blob(chunksRef.current, { type: mimeType }), mimeType })
      setPhase('recorded')
      setShowResult(true)
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
  const isRecording = phase === 'recording'
  const rejected = result?.signal_quality_flag === 'rejected'
  const qualityPercent =
    result?.signal_quality_score != null ? Math.round(result.signal_quality_score * 100) : null
  const remaining = Math.max(0, Math.ceil(DURATION - elapsed))

  const dialogTitle = () => {
    if (phase === 'recorded') return 'Rekaman Siap'
    if (phase === 'uploading') return 'Mengunggah Rekaman'
    if (phase === 'processing') return 'Menganalisis Sinyal'
    if (phase === 'failed') return 'Pengukuran Gagal'
    return rejected ? 'Sinyal Ditolak' : 'Hasil Scan'
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* KAMERA PENUH — tombol rekam mengambang di atasnya */}
      <div className="relative w-full flex-1 min-h-90 rounded-3xl overflow-hidden bg-ink-950 border border-ink-800">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
            <CameraOff className="w-8 h-8 text-ink-500" />
            <span className="text-sm font-bold text-ink-200">Kamera tidak dapat diakses</span>
            <p className="text-xs text-ink-400 max-w-xs">
              Izinkan akses kamera di browser lalu muat ulang halaman. ({cameraError})
            </p>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-contain -scale-x-100"
          />
        )}

        {/* Bingkai oval sebagai panduan posisi wajah */}
        {!cameraError && (
          <div className="absolute inset-0 flex items-start justify-center pt-[8%] pointer-events-none">
            <div
              className={`w-[46%] max-w-64 aspect-3/4 border-2 border-dashed rounded-[50%] transition-colors ${
                isRecording ? 'border-emerald-400' : 'border-clay-400/70 animate-pulse'
              }`}
            />
          </div>
        )}

        {/* Status kamera */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">

          {isRecording && (
            <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs text-white font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {remaining}s
            </span>
          )}

          {!isRecording && (result || recording) && !showResult && (
            <button
              type="button"
              onClick={() => setShowResult(true)}
              className="bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-full text-xs text-white font-semibold hover:bg-black/75 transition cursor-pointer"
            >
              Lihat hasil
            </button>
          )}
        </div>

        {/* Bilah progres perekaman */}
        {isRecording && (
          <div className="absolute bottom-32 left-6 right-6 h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-200"
              style={{ width: `${Math.min(100, (elapsed / DURATION) * 100)}%` }}
            />
          </div>
        )}

        {/* TOMBOL REKAM */}
        <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!ready || isBusy}
            aria-label={isRecording ? 'Hentikan rekaman' : 'Mulai rekam'}
            className="w-20 h-20 rounded-3xl bg-white/95 border-2 border-white flex items-center justify-center shadow-2xl transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span
              className={`bg-rose-600 transition-all ${
                isRecording ? 'w-6 h-6 rounded-md' : 'w-11 h-11 rounded-full'
              }`}
            />
          </button>
          <span className="text-xs font-semibold text-white/90 drop-shadow">
            {isRecording
              ? 'Ketuk untuk berhenti'
              : isBusy
              ? 'Memproses…'
              : `Rekam ${DURATION} detik`}
          </span>
        </div>
      </div>

      <p className="shrink-0 text-center text-xs text-ink-500">
        Duduk tenang dengan cahaya merata di wajah, tanpa masker atau penutup dahi.
      </p>

      {/* POPUP HASIL SCAN / STATUS UNGGAH */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="w-full max-w-md bg-white rounded-3xl p-6 border border-ink-200 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="pb-3 border-b border-ink-100">
            <DialogTitle className="text-base font-bold text-ink-900 tracking-tight">
              {dialogTitle()}
            </DialogTitle>
            <DialogDescription className="text-xs text-ink-500">
              {phase === 'recorded'
                ? `Rekaman ${DURATION} detik siap dikirim untuk dianalisis.`
                : isBusy
                ? 'Mohon tunggu, jangan tutup halaman ini.'
                : 'Hasil analisis sinyal mikrovaskular wajah.'}
            </DialogDescription>
          </DialogHeader>

          {message && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}

          {isBusy && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="w-8 h-8 text-clay-600 animate-spin" />
              <span className="text-xs font-semibold text-ink-600">
                {phase === 'uploading' ? 'Mengunggah rekaman…' : 'Server sedang menganalisis…'}
              </span>
            </div>
          )}

          {phase === 'done' && !rejected && result && (
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

              {result.disclaimer && (
                <p className="text-[11px] text-ink-400 leading-relaxed pt-3 border-t border-ink-100">
                  {result.disclaimer}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
            {phase === 'recorded' && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowResult(false)
                    startRecording()
                  }}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-ink-600 hover:bg-ink-100 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Rekam Ulang
                </Button>
                <Button
                  size="sm"
                  onClick={() => void upload()}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-ink-900 hover:bg-ink-800 text-white shadow-xs cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-clay-300" />
                  Unggah & Analisis
                </Button>
              </>
            )}

            {(phase === 'done' || phase === 'failed') && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowResult(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-ink-600 hover:bg-ink-100 cursor-pointer"
                >
                  Tutup
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowResult(false)
                    startRecording()
                  }}
                  disabled={!ready}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-ink-900 hover:bg-ink-800 text-white shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-clay-300" />
                  Ukur Lagi
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RppgMeasure
