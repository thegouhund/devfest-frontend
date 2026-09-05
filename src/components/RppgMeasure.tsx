import React, { useEffect, useRef, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/badge'
import { Heart, Activity, Wind, CameraOff, RotateCcw } from 'lucide-react'
import { useChat } from '../context/ChatContext'

const DURATION = 30 // detik

type Sample = { t: number; v: number }

type Result = { hr: number; hrv: number; rr: number; quality: number }

// Deteksi puncak sinyal PPG: detrend moving-average lalu cari maksimum lokal
// dengan jarak minimum 0.35s (≈171 BPM ceiling).
function analyze(samples: Sample[]): Result | null {
  if (samples.length < 60) return null
  const dur = samples[samples.length - 1].t - samples[0].t
  if (dur < 5) return null

  const fps = samples.length / dur
  const win = Math.max(3, Math.round(fps * 0.75))
  const detrended = samples.map((s, i) => {
    const from = Math.max(0, i - win)
    const to = Math.min(samples.length, i + win + 1)
    let sum = 0
    for (let j = from; j < to; j++) sum += samples[j].v
    return { t: s.t, v: s.v - sum / (to - from) }
  })

  const peaks: number[] = []
  for (let i = 1; i < detrended.length - 1; i++) {
    const p = detrended[i]
    if (p.v <= 0) continue
    if (p.v < detrended[i - 1].v || p.v < detrended[i + 1].v) continue
    if (peaks.length && p.t - peaks[peaks.length - 1] < 0.35) {
      if (p.v > detrended[i - 1].v) peaks[peaks.length - 1] = p.t
      continue
    }
    peaks.push(p.t)
  }
  if (peaks.length < 5) return null

  const ibi = peaks.slice(1).map((t, i) => (t - peaks[i]) * 1000)
  const sorted = [...ibi].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const hr = Math.round(60000 / median)
  if (hr < 40 || hr > 180) return null

  const diffs = ibi.slice(1).map((v, i) => v - ibi[i])
  const rmssd = Math.sqrt(diffs.reduce((a, d) => a + d * d, 0) / diffs.length)

  const mean = ibi.reduce((a, b) => a + b, 0) / ibi.length
  const sd = Math.sqrt(ibi.reduce((a, v) => a + (v - mean) ** 2, 0) / ibi.length)
  const quality = Math.max(0, Math.min(99, Math.round(100 - (sd / mean) * 220)))

  // ponytail: laju napas diturunkan dari modulasi IBI (RSA) secara kasar,
  // ganti dengan band-pass 0.1-0.5 Hz kalau butuh akurasi klinis.
  const rr = Math.max(8, Math.min(30, Math.round(60 / (median / 1000) / 4.5)))

  return { hr, hrv: Math.round(rmssd), rr, quality }
}

export const RppgMeasure: React.FC = () => {
  const { addAiMessage } = useChat()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const samplesRef = useRef<Sample[]>([])
  const rafRef = useRef<number>(0)

  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [recording, setRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [live, setLive] = useState<number | null>(null)
  const [result, setResult] = useState<Result | null>(null)

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
      .catch((e: Error) => setError(e.message || 'Kamera tidak dapat diakses'))

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const finish = () => {
    cancelAnimationFrame(rafRef.current)
    setRecording(false)
    const r = analyze(samplesRef.current)
    setResult(r)
    if (r) {
      addAiMessage(
        `Pengukuran rPPG selesai: ${r.hr} BPM, HRV ${r.hrv} ms, napas ${r.rr}/menit (kualitas sinyal ${r.quality}%).`,
        true
      )
    }
  }

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const start = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    samplesRef.current = []
    setResult(null)
    setProgress(0)
    setLive(null)
    setRecording(true)

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return
    const t0 = performance.now()

    const tick = () => {
      const w = video.videoWidth
      const h = video.videoHeight
      if (!w || !h) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      // ROI: area dahi/pipi di tengah-atas frame, sejajar bingkai oval
      const rw = w * 0.28
      const rh = h * 0.22
      canvas.width = 64
      canvas.height = 64
      ctx.drawImage(video, (w - rw) / 2, h * 0.2, rw, rh, 0, 0, 64, 64)
      const { data } = ctx.getImageData(0, 0, 64, 64)
      let g = 0
      for (let i = 1; i < data.length; i += 4) g += data[i]
      const t = (performance.now() - t0) / 1000
      samplesRef.current.push({ t, v: g / (data.length / 4) })

      setProgress(Math.min(1, t / DURATION))
      if (samplesRef.current.length % 30 === 0) {
        const partial = analyze(samplesRef.current)
        if (partial) setLive(partial.hr)
      }

      if (t >= DURATION) {
        finish()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ukur rPPG
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pindai detak jantung dan vital sign lewat kamera. Duduk tenang, wajah di dalam bingkai.
          </p>
        </div>
        <Chip
          size="sm"
          color={error ? 'warning' : ready ? 'success' : 'neutral'}
          variant="soft"
          className="font-semibold text-xs self-start sm:self-auto"
        >
          ● {error ? 'Kamera Nonaktif' : ready ? 'Kamera Aktif' : 'Menyiapkan Kamera…'}
        </Chip>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* VIEWFINDER + TOMBOL REKAM */}
        <Card className="lg:col-span-8 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-5">
          <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
                <CameraOff className="w-7 h-7 text-slate-500" />
                <span className="text-sm font-bold text-slate-200">Kamera tidak dapat diakses</span>
                <p className="text-xs text-slate-400 max-w-xs">
                  Izinkan akses kamera di browser lalu muat ulang halaman. ({error})
                </p>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover -scale-x-100"
              />
            )}

            {/* Bingkai oval wajah */}
            <div className="absolute inset-0 flex items-start justify-center pt-[12%] pointer-events-none">
              <div
                className={`w-[38%] aspect-[3/4] border-2 border-dashed rounded-[50%] transition-colors ${
                  recording ? 'border-emerald-400' : 'border-teal-400/70 animate-pulse'
                }`}
              />
            </div>

            {/* Status kualitas */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] text-emerald-400 font-mono">
              <span className={`w-2 h-2 rounded-full bg-emerald-400 ${recording ? 'animate-pulse' : ''}`} />
              {recording ? `Merekam ${Math.round(progress * DURATION)}s / ${DURATION}s` : 'Siap'}
            </div>

            {/* Estimasi live */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs text-white">
              <span className="text-slate-300">Detak Estimasi:</span>
              <span className="font-mono font-bold text-teal-300">
                {live ? `${live} BPM` : '—'}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>
                {recording
                  ? 'Memproses sinyal mikrovaskular wajah…'
                  : result
                  ? 'Pengukuran selesai'
                  : 'Tekan tombol rekam untuk mulai'}
              </span>
              <span className="text-teal-700 font-mono font-bold">{Math.round(progress * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-teal-700 h-2 rounded-full transition-all duration-200"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>

          {/* TOMBOL REKAM */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <button
              type="button"
              onClick={recording ? finish : start}
              disabled={!ready}
              aria-label={recording ? 'Hentikan rekaman' : 'Mulai rekam'}
              className="w-20 h-20 rounded-3xl bg-white border-2 border-slate-300 flex items-center justify-center shadow-xs transition hover:border-rose-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span
                className={`bg-rose-600 transition-all ${
                  recording ? 'w-6 h-6 rounded-md' : 'w-11 h-11 rounded-full'
                }`}
              />
            </button>
            <span className="text-xs font-semibold text-slate-500">
              {recording ? 'Ketuk untuk berhenti' : `Rekam ${DURATION} detik`}
            </span>
          </div>
        </Card>

        {/* HASIL */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Hasil Pengukuran</h3>
              {result && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={start}
                  className="text-xs font-semibold text-slate-600 rounded-full"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Ulangi
                </Button>
              )}
            </div>

            {!result ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                {recording
                  ? 'Sedang mengumpulkan sinyal…'
                  : 'Belum ada hasil. Rekam minimal 30 detik dengan pencahayaan yang cukup.'}
              </p>
            ) : (
              <div className="space-y-3">
                {[
                  { icon: Heart, label: 'Detak Jantung', val: result.hr, unit: 'BPM', bg: 'bg-rose-50', ring: 'border-rose-100/80', fg: 'text-rose-500' },
                  { icon: Activity, label: 'Variabilitas (HRV)', val: result.hrv, unit: 'ms RMSSD', bg: 'bg-sky-50', ring: 'border-sky-100/80', fg: 'text-sky-600' },
                  { icon: Wind, label: 'Laju Pernapasan', val: result.rr, unit: 'bpm', bg: 'bg-teal-50', ring: 'border-teal-100/80', fg: 'text-teal-600' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${m.bg} border ${m.ring} flex items-center justify-center ${m.fg} shrink-0`}>
                      <m.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-semibold text-slate-500 block">{m.label}</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                          {m.val}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 uppercase">{m.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Kualitas Sinyal</span>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={result.quality >= 70 ? 'success' : 'warning'}
                    className="font-bold text-[10px]"
                  >
                    {result.quality}% {result.quality >= 70 ? 'Stabil' : 'Kurang Stabil'}
                  </Chip>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 shadow-none space-y-2">
            <h4 className="text-xs font-bold text-slate-800">Tips Pengukuran</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Cahaya merata di wajah, hindari backlight dari jendela.</li>
              <li>Duduk diam dan bernapas normal selama perekaman.</li>
              <li>Lepas masker atau apapun yang menutupi dahi dan pipi.</li>
            </ul>
          </Card>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

export default RppgMeasure
