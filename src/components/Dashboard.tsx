import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Button, ButtonGroup } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextField } from '@/components/ui/field'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { LineChart, ChartsReferenceLine } from '@mui/x-charts'
import {
  Heart,
  Activity,
  Wind,
  Video,
  ArrowUpRight,
  Plus,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserPen,
  User,
} from 'lucide-react'
import { useChat } from '../context/ChatContext'
import FamilyMonitoring from './FamilyMonitoring'
import { HistoryAndTrends } from './HistoryAndTrends'
import RppgMeasure from './RppgMeasure'
import ActivityLog from './ActivityLog'
import Copilot from './Copilot'
import { ProfileFormDialog, type ProfileFormValues } from './ProfileFormDialog'

import {
  activityCategories,
  buildNote,
  fromApiCategory,
  fromOccurredAt,
  iconFor,
  nowHHMM,
  parseNote,
  toApiCategory,
  toOccurredAt,
  todayISO,
  type ActivityCategory,
  type ActivityItem,
  type NewActivityInput,
} from '@/lib/activities'
import { ApiError } from '@/lib/api'
import {
  ageFrom,
  getAccount,
  updateAccount,
  updateProfile,
  type Account,
} from '@/lib/auth-api'
import {
  createActivity as createActivityApi,
  deleteActivity as deleteActivityApi,
  findMetric,
  getVitalsSummary,
  getVitalsTrend,
  listActivities,
  listAnomalies,
  listMeasurements,
  type ActivityResponse,
  type Anomaly,
  type MeasurementSession,
  type MetricType,
  type SummaryResponse,
  type TrendBucket,
} from '@/lib/health-api'
import { useAuth } from '../context/AuthContext'
import { NAV_PATHS, ROUTES, navIdFromPath, navigate, usePath } from '@/lib/router'

const toActivityItem = (activity: ActivityResponse): ActivityItem => {
  const category = fromApiCategory(activity.category)
  const { title, detail } = parseNote(activity.note, category)
  return { id: activity.id, category, title, detail, ...fromOccurredAt(activity.occurred_at) }
}

export interface UserProfile {
  id: string
  name: string
  role: string
  age: number
  avatarBg: string
  hr: number
  hrv: number
  rr: number
  status: string
  signalQuality: number
}

/** Rentang tanggal kalender menjadi parameter start/end ISO milik backend. */
const rangeToQuery = (range: DateRange | undefined) => {
  const from = range?.from ?? new Date()
  const to = range?.to ?? from
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

const METRIC_LABEL: Record<string, string> = {
  heart_rate: 'Detak Jantung',
  hrv_rmssd: 'Variabilitas (HRV)',
  respiration_rate: 'Laju Pernapasan',
}

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

const bucketLabel = (iso: string, dayCount: number) => {
  const date = new Date(iso)
  if (dayCount <= 7) {
    return `${date.toLocaleDateString('id-ID', { weekday: 'short' })} (${date.getDate()})`
  }
  return `${date.getDate()} ${date.toLocaleDateString('id-ID', { month: 'short' })}`
}

export interface DashboardProps {
  onLogout?: () => void
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { addAiMessage } = useChat()
  const { profile, refreshProfile } = useAuth()
  // Tab aktif berasal dari URL, jadi tiap menu punya alamatnya sendiri dan
  // tombol kembali browser berfungsi.
  const activeNav = navIdFromPath(usePath())
  const goTo = (id: string) => navigate(NAV_PATHS[id] ?? ROUTES.dashboard)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  // Mode harian dihapus: bucket terkecil backend adalah `day`, jadi satu hari
  // hanya menghasilkan satu titik pada grafik.
  const [timeRange, setTimeRange] = useState<'mingguan' | 'bulanan'>('mingguan')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const to = new Date()
    const from = new Date()
    from.setDate(to.getDate() - 6)
    return { from, to }
  })
  const showActivityOverlay = true
  const [showHrvComparison, setShowHrvComparison] = useState(true)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [selectedLogCategory, setSelectedLogCategory] = useState<ActivityCategory | null>(null)
  const [logDetail, setLogDetail] = useState('')
  const [logError, setLogError] = useState<string | null>(null)

  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [hrTrend, setHrTrend] = useState<TrendBucket[]>([])
  const [hrvTrend, setHrvTrend] = useState<TrendBucket[]>([])
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [latestSession, setLatestSession] = useState<MeasurementSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  /** Kartu "Denyut Mingguan" selalu 7 hari terakhir, tidak ikut rentang kalender. */
  const [weeklyHr, setWeeklyHr] = useState<TrendBucket[]>([])

  const range = useMemo(() => rangeToQuery(dateRange), [dateRange])
  const profileId = profile?.id

  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      // family_member_id dikirim eksplisit di semua endpoint: sebagian
      // mengembalikan data seluruh profil yang boleh dilihat kalau dikosongkan,
      // sedangkan dashboard ini hanya untuk profil yang sedang aktif.
      const scoped = { ...range, family_member_id: profileId }

      const [summaryData, hr, hrv, activityData, anomalyData, sessions] = await Promise.all([
        getVitalsSummary(scoped),
        getVitalsTrend('heart_rate', { ...scoped, bucket: 'day' }),
        getVitalsTrend('hrv_rmssd', { ...scoped, bucket: 'day' }),
        // Tanpa filter rentang: daftar ini juga dipakai halaman Aktivitas.
        // Penanda di grafik tetap aman karena hanya tanggal yang punya bucket
        // yang dipetakan.
        listActivities({ limit: 50, family_member_id: profileId }),
        listAnomalies({ status: 'new', limit: 50, family_member_id: profileId }),
        listMeasurements(1, profileId),
      ])
      setSummary(summaryData)
      setHrTrend(hr.buckets)
      setHrvTrend(hrv.buckets)
      setActivities(activityData.activities.map(toActivityItem))
      setAnomalies(anomalyData.anomalies)
      setLatestSession(sessions.sessions[0] ?? null)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Gagal memuat data dashboard')
    } finally {
      setIsLoading(false)
    }
  }, [range, profileId])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const lastWeek = rangeToQuery({ from: daysAgo(6), to: new Date() })
    getVitalsTrend('heart_rate', { ...lastWeek, bucket: 'day', family_member_id: profileId })
      .then((r) => setWeeklyHr(r.buckets))
      .catch(() => setWeeklyHr([]))
  }, [profileId])

  // Email & telepon hanya dibutuhkan saat dialog profil dibuka.
  useEffect(() => {
    if (!isProfileDialogOpen || account) return
    getAccount()
      .then(setAccount)
      .catch(() => {
        /* bagian akun disembunyikan kalau gagal dimuat */
      })
  }, [isProfileDialogOpen, account])

  const saveOwnProfile = async (values: ProfileFormValues) => {
    if (!profile) return
    await updateProfile(profile.id, {
      full_name: values.fullName.trim(),
      date_of_birth: values.dateOfBirth || null,
      gender: values.gender === 'Perempuan' ? 'female' : 'male',
      relationship_label: values.relation || null,
      height_cm: parseFloat(values.height) || null,
      weight: parseFloat(values.weight) || null,
      ui_mode: values.uiMode,
    })

    const phone = values.phone.trim()
    if (account && phone !== (account.phone ?? '')) {
      setAccount(await updateAccount(phone || null))
    }
    await refreshProfile()
  }

  // Bucket kosong tidak dikirim backend, jadi deret HR dan HRV disatukan
  // berdasarkan tanggal bucket dan celahnya diisi null agar garis terputus.
  const currentChartData = useMemo(() => {
    const byBucket = new Map<string, { hr: number | null; hrv: number | null }>()
    for (const b of hrTrend) byBucket.set(b.bucket, { hr: b.avg, hrv: null })
    for (const b of hrvTrend) {
      const existing = byBucket.get(b.bucket)
      if (existing) existing.hrv = b.avg
      else byBucket.set(b.bucket, { hr: null, hrv: b.avg })
    }
    const sorted = [...byBucket.entries()].sort(([a], [b]) => a.localeCompare(b))
    return sorted.map(([bucket, values]) => ({
      time: bucket,
      label: bucketLabel(bucket, sorted.length),
      hr: values.hr,
      hrv: values.hrv,
    }))
  }, [hrTrend, hrvTrend])

  /** yyyy-mm-dd → label sumbu X, untuk menempatkan penanda aktivitas di grafik. */
  const bucketLabelByDate = useMemo(() => {
    const map = new Map<string, string>()
    for (const point of currentChartData) {
      map.set(new Date(point.time).toISOString().slice(0, 10), point.label)
    }
    return map
  }, [currentChartData])

  const heartRate = findMetric(summary, 'heart_rate')
  const hrvMetric = findMetric(summary, 'hrv_rmssd')
  const respiration = findMetric(summary, 'respiration_rate')

  /** Metrik dianggap perlu perhatian kalau punya anomali yang belum ditangani. */
  const anomalyFor = (metric: MetricType) => {
    const matches = anomalies.filter((a) => a.metric_type === metric)
    if (matches.length === 0) return null
    return (
      matches.find((a) => a.severity === 'high') ??
      matches.find((a) => a.severity === 'medium') ??
      matches[0]
    )
  }

  /** Rata-rata HR pada rentang, untuk kartu bar mingguan. */
  const weeklyBars = useMemo(() => {
    const max = Math.max(...weeklyHr.map((b) => b.avg), 1)
    const peak = weeklyHr.reduce((best, b) => Math.max(best, b.avg), 0)
    return weeklyHr.map((bucket) => ({
      label: new Date(bucket.bucket).toLocaleDateString('id-ID', { weekday: 'short' }),
      value: bucket.avg,
      height: `${Math.max(8, (bucket.avg / max) * 100)}%`,
      highlight: bucket.avg === peak,
    }))
  }, [weeklyHr])

  /** Rata-rata tertimbang jumlah pengukuran, bukan rata-rata dari rata-rata. */
  const weeklyAverage = useMemo(() => {
    const totalCount = weeklyHr.reduce((sum, b) => sum + b.count, 0)
    if (totalCount === 0) return null
    return weeklyHr.reduce((sum, b) => sum + b.avg * b.count, 0) / totalCount
  }, [weeklyHr])

  // baseline.is_active=false berarti data belum cukup (butuh ≥14 hari).
  const hrBaseline = heartRate?.baseline?.is_active ? heartRate.baseline.mean : null

  const metricCards = [
    {
      label: 'Detak Jantung',
      unit: 'BPM',
      icon: Heart,
      iconBg: 'bg-rose-50',
      iconRing: 'border-rose-100/80',
      iconFg: 'text-rose-500',
      metric: heartRate,
      anomaly: anomalyFor('heart_rate'),
      change: heartRate?.previous_period?.change_percent ?? null,
    },
    {
      label: 'Variabilitas (HRV)',
      unit: 'ms RMSSD',
      icon: Activity,
      iconBg: 'bg-sage-50',
      iconRing: 'border-sage-100/80',
      iconFg: 'text-sage-600',
      metric: hrvMetric,
      anomaly: anomalyFor('hrv_rmssd'),
      change: hrvMetric?.previous_period?.change_percent ?? null,
    },
    {
      label: 'Laju Pernapasan',
      unit: 'bpm',
      icon: Wind,
      iconBg: 'bg-clay-50',
      iconRing: 'border-clay-100/80',
      iconFg: 'text-clay-600',
      metric: respiration,
      anomaly: anomalyFor('respiration_rate'),
      change: respiration?.previous_period?.change_percent ?? null,
    },
  ]

  const signalQuality =
    latestSession?.signal_quality_score != null
      ? Math.round(latestSession.signal_quality_score * 100)
      : null

  const currentUser: UserProfile = {
    id: profile?.id ?? '',
    name: profile?.full_name ?? 'Profil',
    role: profile?.relationship_label ?? (profile?.role === 'admin' ? 'Admin Keluarga' : 'Anggota'),
    age: ageFrom(profile?.date_of_birth ?? null) ?? 0,
    avatarBg: 'bg-clay-700',
    hr: Math.round(heartRate?.avg ?? 0),
    hrv: Math.round(hrvMetric?.avg ?? 0),
    rr: Math.round(respiration?.avg ?? 0),
    status: anomalyFor('heart_rate') ? 'Perlu Perhatian' : 'Normal',
    signalQuality: signalQuality ?? 0,
  }

  const formattedRangeLabel = useMemo(() => {
    if (!dateRange?.from) return 'Pilih Rentang'
    const fromStr = dateRange.from.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    if (!dateRange.to || dateRange.from.getTime() === dateRange.to.getTime()) {
      return `${fromStr} 2026 (Harian)`
    }
    const toStr = dateRange.to.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${fromStr} - ${toStr}`
  }, [dateRange])

  const categories = activityCategories

  const addActivity = async (input: NewActivityInput) => {
    const created = await createActivityApi({
      category: toApiCategory(input.category),
      note: buildNote(input),
      occurred_at: toOccurredAt(input),
    })
    const newAct = toActivityItem(created)
    setActivities((prev) => [newAct, ...prev])
    addAiMessage(
      `Aktivitas "${newAct.title}" berhasil dicatat dan dipetakan ke grafik tren vital Anda.`,
      true
    )
  }

  const removeActivity = async (id: string) => {
    await deleteActivityApi(id)
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  const handleAddActivity = async () => {
    if (!selectedLogCategory) return
    setLogError(null)
    try {
      await addActivity({
        category: selectedLogCategory,
        detail: logDetail,
        date: todayISO(),
        time: nowHHMM(),
      })
      setIsLogModalOpen(false)
      setSelectedLogCategory(null)
      setLogDetail('')
    } catch (error) {
      setLogError(error instanceof ApiError ? error.message : 'Gagal menyimpan aktivitas')
    }
  }


  // Copilot dan rPPG mengisi tinggi layar; sisanya mengalir seperti biasa.
  const isFullHeight = activeNav === 'copilot' || activeNav === 'rppg'

  return (
    <div
      className={`min-h-screen bg-sand text-ink-900 flex flex-col items-center justify-start p-3 sm:p-5 lg:p-7 font-sans antialiased w-full ${
        isFullHeight ? 'h-dvh max-h-dvh overflow-hidden' : ''
      }`}
    >
      {/* MAIN CONTAINER */}
      <div
        className={`w-full max-w-[98vw] 2xl:max-w-[1920px] mx-auto ${
          isFullHeight
            ? 'flex-1 flex flex-col min-h-0 space-y-3 sm:space-y-4 lg:space-y-5'
            : 'space-y-6'
        }`}
      >
        {/* 1. TOP APP BAR / BRAND HEADER */}
        <header className="shrink-0 flex flex-wrap md:flex-nowrap items-center md:justify-between gap-3 md:gap-4 bg-white border border-ink-200/80 rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-3 sm:py-3.5 shadow-xs">
          {/* Brand Logo with official logo image */}
          <div className="order-1 flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-ink-200/80 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
              <img src="/logo.png" alt="Nadiku Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-ink-900 tracking-tight block leading-tight">
                Nadiku
              </span>
              <span className="text-xs text-rose-600 font-semibold tracking-wide uppercase">
                Family Health Monitor
              </span>
            </div>
          </div>

          {/* Navigation Pill Group */}
          {/* Di mobile nav pindah ke baris sendiri agar tidak berdesakan dengan brand */}
          {/* Membungkus, bukan menggulir: nav yang digulir tanpa scrollbar
              memotong item tanpa petunjuk apa pun bahwa masih ada lanjutannya. */}
          <nav className="order-3 md:order-2 w-full md:w-auto min-w-0 flex flex-wrap items-center justify-center md:justify-start gap-1 bg-ink-100/80 p-1.5 rounded-2xl md:rounded-full border border-ink-200/60">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'rppg', label: 'Ukur BPM' },
              { id: 'riwayat', label: 'Riwayat' },
              { id: 'aktivitas', label: 'Aktivitas' },
              { id: 'keluarga', label: 'Keluarga' },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeNav === tab.id ? 'default' : 'ghost'}
                onClick={() => goTo(tab.id)}
                className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeNav === tab.id
                    ? 'bg-ink-900 text-white shadow-xs font-bold'
                    : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                {tab.label}
              </Button>
            ))}

            {/* Copilot dipisah di ujung kanan dengan aksen clay agar menonjol */}
            <span className="hidden md:block w-px h-5 bg-ink-300/70 mx-1" aria-hidden />
            <Button
              size="sm"
              variant={activeNav === 'copilot' ? 'default' : 'ghost'}
              onClick={() => goTo('copilot')}
              className={`px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeNav === 'copilot'
                  ? 'bg-clay-600 text-white shadow-sm hover:bg-clay-700'
                  : 'text-clay-700 bg-clay-50 border border-clay-200 hover:bg-clay-100'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${activeNav === 'copilot' ? 'text-white' : 'text-clay-600'}`} />
              Copilot
            </Button>
          </nav>

          {/* Right Action Icons & User Account Avatar (matching reference header) */}
          <div className="order-2 md:order-3 ml-auto md:ml-0 flex items-center gap-2 sm:gap-2.5">
        

            {/* Current User Avatar & Profile */}
            <button
              type="button"
              onClick={() => setIsProfileDialogOpen(true)}
              title="Edit profil saya"
              className="flex items-center gap-2 pl-2 border-l border-ink-200 rounded-r-full pr-2 py-1 hover:bg-ink-100/70 transition cursor-pointer"
            >
              <span className="w-8 h-8 rounded-full bg-clay-700 text-white flex items-center justify-center shadow-xs shrink-0">
                <User className="w-4 h-4" />
              </span>
              <div className="text-left hidden sm:flex flex-col">
                <span className="text-xs font-bold text-ink-800 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-ink-500 leading-none">
                  {currentUser.role}
                </span>
              </div>
              <UserPen className="w-3.5 h-3.5 text-ink-400 shrink-0" />
            </button>

            {/* Tombol Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogoutDialogOpen(true)}
              className="h-8 px-2.5 rounded-full text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition cursor-pointer border border-transparent hover:border-rose-200"
              title="Keluar dari akun"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        </header>

        {/* 2. MAIN DASHBOARD CONTENT */}
        <main
          className={`w-full ${
            isFullHeight ? 'flex-1 flex flex-col min-h-0' : 'space-y-6'
          }`}
        >
          {activeNav === 'keluarga' ? (
            <FamilyMonitoring />
          ) : activeNav === 'copilot' ? (
            <Copilot />
          ) : activeNav === 'rppg' ? (
            <RppgMeasure />
          ) : activeNav === 'aktivitas' ? (
            <ActivityLog
              activities={activities}
              onAdd={addActivity}
              onDelete={removeActivity}
            />
          ) : activeNav === 'riwayat' ? (
            <HistoryAndTrends
              member={currentUser}
              onNavigateToRppg={() => goTo('rppg')}
            />
          ) : activeNav !== 'dashboard' ? (
            <div className="py-20 text-center">
              <span className="text-sm font-bold text-ink-500 uppercase tracking-widest block mb-2">
                Sedang Dibangun
              </span>
              <p className="text-ink-600">
                Fitur <strong className="text-ink-900">{activeNav}</strong> belum tersedia pada fase ini.
              </p>
            </div>
          ) : (
            <>
              {/* SECTION: TITLE & KEY METRICS HEADER */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
                      Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
                      Pantau indikator kesehatan vital, ritme kardiovaskular, dan aktivitas harian Anda.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <Button
                      onClick={() => goTo('rppg')}
                      className="h-10 px-5 rounded-full text-sm font-bold bg-clay-600 hover:bg-clay-700 text-white shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-2 order-first sm:order-last"
                    >
                      <Video className="w-4 h-4" />
                      Mulai Ukur BPM
                      <ArrowUpRight className="w-4 h-4" />
                    </Button>

                    {isLoading && (
                      <Chip size="sm" color="neutral" variant="soft" className="font-semibold text-xs">
                        Memuat data…
                      </Chip>
                    )}
                   
                  </div>
                </div>

                {loadError && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                    <span>{loadError}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void reload()}
                      className="rounded-full text-xs font-semibold cursor-pointer"
                    >
                      Coba lagi
                    </Button>
                  </div>
                )}

                {/* Sub-header: "Key Metrics" with Dark Pill Selector */}
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-sm sm:text-base font-bold text-ink-800 tracking-tight">
                    Key Metrics
                  </h2>

                  {/* <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                      className="bg-ink-900 hover:bg-ink-800 text-white rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <span>{timeRange === 'bulanan' ? 'Monthly' : 'Weekly'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-ink-300" />
                    </button>

                    {isTimeDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-ink-200 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            setTimeRange('bulanan')
                            setIsTimeDropdownOpen(false)
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-ink-50 text-ink-700 font-medium flex items-center justify-between cursor-pointer"
                        >
                          Monthly {timeRange === 'bulanan' && <Check className="w-3.5 h-3.5 text-clay-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTimeRange('mingguan')
                            setIsTimeDropdownOpen(false)
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-ink-50 text-ink-700 font-medium flex items-center justify-between cursor-pointer"
                        >
                          Weekly {timeRange === 'mingguan' && <Check className="w-3.5 h-3.5 text-clay-600" />}
                        </button>
                      </div>
                    )}
                  </div> */}
                </div>

                {/* ROW: 4 DEFINED KEY METRIC CARDS (FOLLOWING REFERENCE IMAGE STYLE) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metricCards.map((card) => (
                    <Card
                      key={card.label}
                      className="p-5 rounded-2xl bg-white border border-ink-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${card.iconBg} border ${card.iconRing} flex items-center justify-center ${card.iconFg} shrink-0`}>
                          <card.icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-semibold text-ink-500 block">{card.label}</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight leading-none">
                              {card.metric ? Math.round(card.metric.avg) : '—'}
                            </span>
                            <span className="text-xs font-semibold text-ink-400 uppercase">{card.unit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-ink-100 gap-2">
                        {card.change !== null ? (
                          <span
                            className={`font-semibold flex items-center gap-0.5 ${
                              card.change >= 0 ? 'text-emerald-600' : 'text-clay-600'
                            }`}
                          >
                            {card.change >= 0 ? '↗' : '↘'} {Math.abs(card.change).toFixed(1)}%
                            <span className="text-ink-400 font-normal">vs periode lalu</span>
                          </span>
                        ) : (
                          <span className="text-ink-400">Belum ada pembanding</span>
                        )}

                        <Chip
                          size="sm"
                          color={card.anomaly ? (card.anomaly.severity === 'high' ? 'warning' : 'warning') : 'success'}
                          variant="soft"
                          className="font-bold text-[10px] shrink-0"
                        >
                          {card.anomaly ? 'Perlu Perhatian' : 'Normal'}
                        </Chip>
                      </div>

                      <span className="block text-[11px] text-ink-400 -mt-1">
                        {card.metric?.baseline?.is_active
                          ? `Baseline ${Math.round(card.metric.baseline.mean)} ${card.unit}`
                          : 'Baseline sedang dikumpulkan'}
                      </span>
                    </Card>
                  ))}

                </div>
              </div>

              {/* 2-COLUMN SECTION: STARTS LEVEL WITH DETAK JANTUNG */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
                {/* LEFT COLUMN: 8 COLS (PROMINENT BIOMETRIC TIME-SERIES TREND CARD) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-ink-200/80 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink-100">
                      <div>
                        <h2 className="text-base font-bold text-ink-900 tracking-tight">
                          Tren Vital Sign                        </h2>
                        <p className="text-xs text-ink-500 mt-0.5">
                          Korelasi fluktuasi denyut nadi dengan kebiasaan gaya hidup Anda.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="hrv-comparison"
                            checked={showHrvComparison}
                            onCheckedChange={setShowHrvComparison}
                          />
                          <Label htmlFor="hrv-comparison" className="text-xs font-semibold text-ink-700 cursor-pointer">
                            Bandingkan HRV
                          </Label>
                        </div>

                        <ButtonGroup variant="secondary" className="bg-ink-100 p-1 rounded-full text-xs">
                          <Button
                            size="sm"
                            variant={timeRange === 'mingguan' ? 'default' : 'ghost'}
                            onClick={() => {
                              setTimeRange('mingguan')
                              setDateRange({ from: daysAgo(6), to: new Date() })
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              timeRange === 'mingguan'
                                ? 'bg-white text-ink-900 shadow-xs font-bold'
                                : 'text-ink-500'
                            }`}
                          >
                            Mingguan
                          </Button>
                          <Button
                            size="sm"
                            variant={timeRange === 'bulanan' ? 'default' : 'ghost'}
                            onClick={() => {
                              setTimeRange('bulanan')
                              setDateRange({ from: daysAgo(29), to: new Date() })
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              timeRange === 'bulanan'
                                ? 'bg-white text-ink-900 shadow-xs font-bold'
                                : 'text-ink-500'
                            }`}
                          >
                            Bulanan
                          </Button>
                        </ButtonGroup>
                      </div>
                    </div>

                    {/* 2-COLUMN SECTION: SEBELAH KIRI RANGE CALENDAR SHADCN, SEBELAH KANAN LINE CHART */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch pt-1">
                      {/* SEBELAH KIRI: RANGE CALENDAR SHADCN */}
                      <div className="lg:col-span-5 xl:col-span-4 bg-ink-50/70 border border-ink-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-ink-800 tracking-tight">
                            Pilih Rentang Tanggal
                          </span>
                          <span className="text-[10px] font-semibold text-clay-700 bg-clay-50 border border-clay-200/80 px-2 py-0.5 rounded-full">
                            {formattedRangeLabel}
                          </span>
                        </div>

                        <div className="flex justify-center bg-white rounded-xl border border-ink-200/70 p-2 shadow-2xs">
                          <Calendar
                            mode="range"
                            defaultMonth={dateRange?.from ?? new Date()}
                            selected={dateRange}
                            onSelect={(range) => {
                              setDateRange(range)
                              if (range?.from && range?.to) {
                                const diff = Math.ceil(Math.abs(range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24))
                                setTimeRange(diff <= 7 ? 'mingguan' : 'bulanan')
                              }
                            }}
                            className="p-1"
                          />
                        </div>

                        {/* Presets & Legend Indicator */}
                        <div className="pt-2 border-t border-ink-200/60 flex items-center justify-between text-[11px] text-ink-500">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const to = new Date()
                                const from = new Date()
                                from.setDate(to.getDate() - 6)
                                setDateRange({ from, to })
                                setTimeRange('mingguan')
                              }}
                              className="px-2 py-0.5 rounded-md hover:bg-ink-200/70 text-ink-600 font-semibold cursor-pointer transition text-[11px]"
                            >
                              7 Hari
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={() => {
                                const now = new Date()
                                setDateRange({
                                  from: new Date(now.getFullYear(), now.getMonth(), 1),
                                  to: now,
                                })
                                setTimeRange('bulanan')
                              }}
                              className="px-2 py-0.5 rounded-md hover:bg-ink-200/70 text-ink-600 font-semibold cursor-pointer transition text-[11px]"
                            >
                              Bulan Ini
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* SEBELAH KANAN: LINE CHART MENGIKUTI TANGGAL YANG DISELECT */}
                      <div className="lg:col-span-7 xl:col-span-8 bg-white border border-ink-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                        {/* Interactive Legend (sesuai gambar) */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-ink-100">
                         
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                            {hrBaseline !== null
                              ? `Baseline: ${Math.round(hrBaseline)} BPM`
                              : 'Baseline dikumpulkan'}
                          </span>
                        </div>

                        {/* MUI X Line Chart */}
                        <div className="w-full h-[280px]">
                          <LineChart
                            series={[
                              {
                                id: 'hr-series',
                                data: currentChartData.map((d) => d.hr),
                                label: 'Detak Jantung (BPM)',
                                area: false,
                                curve: 'natural',
                                color: '#C2643B',
                                showMark: true,
                                valueFormatter: (value: number | null) => (value != null ? `${value} BPM` : ''),
                              },
                              ...(showHrvComparison
                                ? [
                                    {
                                      id: 'hrv-series',
                                      data: currentChartData.map((d) => d.hrv),
                                      label: 'HRV (ms)',
                                      area: false,
                                      curve: 'natural' as const,
                                      color: '#62755A',
                                      showMark: true,
                                      valueFormatter: (value: number | null) => (value != null ? `${value} ms` : ''),
                                    },
                                  ]
                                : []),
                            ]}
                            xAxis={[
                              {
                                scaleType: 'point',
                                data: currentChartData.map((d) => d.label),
                                tickLabelStyle: {
                                  fontSize: 10,
                                  fill: '#7D7264',
                                  fontWeight: 500,
                                },
                              },
                            ]}
                            yAxis={[
                              {
                                min: 40,
                                max: 95,
                                tickLabelStyle: {
                                  fontSize: 10,
                                  fill: '#7D7264',
                                  fontWeight: 500,
                                },
                                valueFormatter: (value: number | null) => (value != null ? `${value} BPM` : ''),
                              },
                            ]}
                            grid={{ horizontal: true }}
                            height={270}
                            margin={{ left: 45, right: 20, top: 20, bottom: 25 }}
                            sx={{
                              width: '100%',
                              '& .MuiChartsGrid-line': {
                                stroke: '#F2EEE8',
                                strokeWidth: 1,
                              },
                              '& .MuiLineElement-series-hr-series': {
                                strokeWidth: 2.8,
                              },
                              '& .MuiLineElement-series-hrv-series': {
                                strokeWidth: 2,
                                strokeDasharray: '4 3',
                              },
                            }}
                          >
                            <ChartsReferenceLine
                              y={hrBaseline ?? 0}
                              label={hrBaseline !== null ? `Baseline: ${Math.round(hrBaseline)} BPM` : ''}
                              labelAlign="end"
                              lineStyle={{
                                stroke: '#10B981',
                                strokeDasharray: '4 4',
                                strokeWidth: 1.5,
                              }}
                              labelStyle={{
                                fill: '#065F46',
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            />
                            {showActivityOverlay &&
                              activities.map((act) => {
                                // Bucket harian: aktivitas ditandai pada hari terjadinya.
                                const label = bucketLabelByDate.get(act.date)
                                if (!label) return null
                                return (
                                  <ChartsReferenceLine
                                    key={act.id}
                                    x={label}
                                    label={act.title}
                                    labelAlign="start"
                                    lineStyle={{
                                      stroke: '#C2643B',
                                      strokeDasharray: '3 3',
                                      strokeWidth: 1.2,
                                    }}
                                    labelStyle={{
                                      fill: '#C2643B',
                                      fontSize: 10,
                                      fontWeight: 600,
                                    }}
                                  />
                                )
                              })}
                          </LineChart>
                        </div>
                      </div>
                    </div>

                    {/* Daftar penanda aktivitas pada rentang yang dipilih */}
                    {showActivityOverlay && activities.length > 0 && (
                      <div className="flex items-center gap-2 px-1 pt-1 pb-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-ink-500">Penanda Aktivitas:</span>
                        {activities.map((act) => {
                          const CatIcon = iconFor(act.category)
                          return (
                            <span
                              key={act.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sage-50/80 text-sage-800 border border-sage-200/60 shadow-2xs"
                            >
                              <CatIcon className="w-3 h-3" />
                              <span className="font-semibold">{act.time}</span>
                              <span className="text-ink-400">•</span>
                              <span>{act.title} ({act.detail})</span>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </Card>

                  {/* SHADCN TABLE: AKTIVITAS & LOG GAYA HIDUP TERBARU */}
                  <Card className="flex-1 p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-ink-200/80 shadow-xs hover:shadow-md transition-shadow space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-ink-900 tracking-tight">
                            Aktivitas & Log Terbaru
                          </h3>
                          <Chip size="sm" variant="soft" color="accent" className="font-bold text-[10px]">
                            {activities.length} Aktivitas
                          </Chip>
                        </div>
                        <p className="text-xs text-ink-500 mt-0.5">
                          Korelasi kebiasaan harian terhadap respon denyut nadi dan ritme saraf otonom.
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => goTo('aktivitas')}
                        className="bg-ink-900 hover:bg-ink-800 text-white rounded-full font-bold px-4 py-1.5 text-xs shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Plus className="w-3.5 h-3.5 text-sage-300" />
                        Catat Aktivitas
                      </Button>
                    </div>

                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-ink-100 hover:bg-transparent">
                            <TableHead className="text-ink-500 font-bold text-xs w-[110px]">Waktu</TableHead>
                            <TableHead className="text-ink-500 font-bold text-xs min-w-[150px]">Aktivitas</TableHead>
                            <TableHead className="text-ink-500 font-bold text-xs">Kategori</TableHead>
                            <TableHead className="text-ink-500 font-bold text-xs min-w-[180px]">Keterangan / Detail</TableHead>
                            <TableHead className="text-ink-500 font-bold text-xs min-w-[170px]">Respon Vital Sign</TableHead>
                            <TableHead className="text-ink-500 font-bold text-xs text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activities.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-xs text-ink-400">
                                Belum ada aktivitas yang dicatat hari ini.{' '}
                                <button
                                  type="button"
                                  onClick={() => goTo('aktivitas')}
                                  className="underline text-ink-700 font-semibold hover:text-ink-900 cursor-pointer"
                                >
                                  Klik "Catat Aktivitas"
                                </button>{' '}
                                untuk mulai mencatat.
                              </TableCell>
                            </TableRow>
                          ) : (
                            activities.map((act) => {
                              const catInfo = categories.find((c) => c.key === act.category)
                              const CatIcon = iconFor(act.category)
                              return (
                                <TableRow key={act.id} className="border-ink-100 hover:bg-ink-50/60 transition-colors">
                                  <TableCell className="font-mono text-xs font-semibold text-ink-700">
                                    {act.time}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2.5">
                                      <span className="w-7 h-7 rounded-lg bg-ink-100 flex items-center justify-center shrink-0 shadow-2xs text-ink-600">
                                        <CatIcon className="w-3.5 h-3.5" />
                                      </span>
                                      <span className="font-bold text-xs text-ink-900">{act.title}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="sm"
                                      variant="soft"
                                      color={
                                        act.category === 'olahraga'
                                          ? 'accent'
                                          : act.category === 'kopi'
                                          ? 'warning'
                                          : act.category === 'makan'
                                          ? 'success'
                                          : 'neutral'
                                      }
                                      className="font-bold text-[10px] capitalize"
                                    >
                                      {catInfo?.label || act.category}
                                    </Chip>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-xs text-ink-600 max-w-[220px] truncate block">
                                      {act.detail}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    {act.category === 'olahraga' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                        ↗ Denyut naik (+14 BPM)
                                      </span>
                                    ) : act.category === 'kopi' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                        ↗ Stimulan (+6 BPM)
                                      </span>
                                    ) : act.category === 'tidur' ? (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sage-600 bg-sage-50 px-2 py-0.5 rounded-md border border-sage-100">
                                        ↘ Pemulihan (62 BPM)
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                        ✓ Denyut stabil (72 BPM)
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-700">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                      Tersinkron
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </Card>
                </div>

                {/* RIGHT COLUMN: 3 ANALYTICAL CARDS (4 COLS) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Card 1: Peringatan Anomali (dari /anomalies status=new) */}
                  <Card className="flex-1 justify-between p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-ink-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-ink-700">Peringatan Anomali</h3>
                      {anomalies.length > 0 && (
                        <Chip size="sm" variant="soft" color="warning" className="font-bold text-[10px]">
                          {anomalies.length} belum ditinjau
                        </Chip>
                      )}
                    </div>

                    {anomalies.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-ink-700">
                          Tidak ada anomali terbuka
                        </span>
                        <span className="text-[11px] text-ink-500 leading-snug">
                          Nilai vital Anda masih dalam rentang baseline pribadi.
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {anomalies.slice(0, 3).map((anomaly) => {
                          const above = anomaly.observed_value >= anomaly.baseline_mean
                          return (
                            <div
                              key={anomaly.id}
                              className={`p-2.5 rounded-xl border ${
                                anomaly.severity === 'high'
                                  ? 'bg-rose-50/70 border-rose-200'
                                  : anomaly.severity === 'medium'
                                  ? 'bg-amber-50/70 border-amber-200'
                                  : 'bg-ink-50 border-ink-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-ink-900 truncate">
                                  {METRIC_LABEL[anomaly.metric_type] ?? anomaly.metric_type}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase shrink-0 ${
                                    anomaly.severity === 'high'
                                      ? 'text-rose-700'
                                      : anomaly.severity === 'medium'
                                      ? 'text-amber-700'
                                      : 'text-ink-500'
                                  }`}
                                >
                                  {anomaly.severity}
                                </span>
                              </div>

                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-sm font-extrabold text-ink-900">
                                  {Math.round(anomaly.observed_value)}
                                </span>
                                <span className="text-[11px] text-ink-500">
                                  {above ? '↑' : '↓'} dari baseline{' '}
                                  {Math.round(anomaly.baseline_mean)} ·{' '}
                                  {anomaly.deviation_score.toFixed(1)}σ
                                </span>
                              </div>

                              {anomaly.detected_at && (
                                <span className="block text-[10px] text-ink-400 font-mono mt-0.5">
                                  {new Date(anomaly.detected_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => goTo('riwayat')}
                      className="w-full text-center text-xs font-semibold text-ink-600 hover:text-ink-900 pt-1 border-t border-ink-100 cursor-pointer"
                    >
                      {anomalies.length > 3
                        ? `Lihat ${anomalies.length - 3} lainnya di Riwayat`
                        : 'Buka Riwayat'}
                    </button>
                  </Card>

                  {/* Card 2: Weekly Workload / Trend (Bar Chart) */}
                  <Card className="flex-1 justify-between p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-ink-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-ink-700">Denyut Mingguan</h3>
                      <span className="text-xs text-ink-400 font-mono">↗</span>
                    </div>

                    {/* Rata-rata denyut per bucket pada rentang aktif */}
                    <div className="h-28 flex items-end justify-between gap-2 pt-4 px-1 overflow-x-auto">
                      {weeklyBars.length === 0 ? (
                        <span className="text-xs text-ink-400 m-auto">Belum ada data</span>
                      ) : (
                        weeklyBars.map((item) => (
                          <div key={item.label} className="flex-1 min-w-6 flex flex-col items-center gap-1">
                            <div className="w-full bg-ink-100 rounded-t-lg h-20 flex items-end justify-center p-0.5">
                              <div
                                style={{ height: item.height }}
                                className={`w-full rounded-t-md transition-all ${
                                  item.highlight ? 'bg-clay-700' : 'bg-clay-500/70'
                                }`}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-ink-500">{item.label}</span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="text-center text-xs text-ink-500 pt-1 border-t border-ink-100">
                      {weeklyAverage !== null ? (
                        <>
                          Rata-rata 7 hari:{' '}
                          <strong className="text-ink-800 font-bold">
                            {weeklyAverage.toFixed(1)} BPM
                          </strong>
                        </>
                      ) : (
                        'Belum ada pengukuran 7 hari terakhir'
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>

      </div>

      {/* QUICK LOG MODAL */}
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-ink-200 shadow-xl space-y-5">
          <DialogHeader className="flex flex-row items-center gap-2 pb-3 border-b border-ink-100">
            <span className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center shrink-0 text-ink-700">
              {selectedLogCategory && React.createElement(iconFor(selectedLogCategory), { className: 'w-5 h-5' })}
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-ink-900 tracking-tight">
                Catat {categories.find((c) => c.key === selectedLogCategory)?.label}
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-500">Tambahkan detail catatan waktu & aktivitas</DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <TextField className="w-full">
              <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                Catatan / Keterangan
              </Label>
              <Input
                placeholder="misal: 1 cangkir espresso / jalan pagi 30 menit"
                value={logDetail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogDetail(e.target.value)}
                className="w-full text-xs"
              />
            </TextField>

            <div className="flex items-center justify-between text-xs text-ink-500 pt-1">
              <span>
                Waktu Catat: Sekarang ({new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB)
              </span>
            </div>

            {logError && <p className="text-xs text-red-600 font-medium">{logError}</p>}
          </div>

          <DialogFooter className="flex items-center justify-end gap-3 pt-3 border-t border-ink-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogModalOpen(false)}
              className="px-5 py-2 rounded-full text-xs font-semibold text-ink-600 hover:bg-ink-100 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleAddActivity}
              className="px-6 py-2 rounded-full text-xs font-bold bg-ink-900 hover:bg-ink-800 text-white shadow-xs cursor-pointer"
            >
              Simpan Aktivitas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProfileFormDialog
        open={isProfileDialogOpen}
        onOpenChange={setIsProfileDialogOpen}
        mode="edit"
        accountEmail={account?.email}
        initial={{
          fullName: profile?.full_name ?? '',
          relation: profile?.relationship_label ?? 'Lainnya',
          dateOfBirth: profile?.date_of_birth ?? '',
          gender: profile?.gender === 'female' ? 'Perempuan' : 'Laki-laki',
          height: profile?.height_cm ? String(profile.height_cm) : '',
          weight: profile?.weight ? String(profile.weight) : '',
          phone: account?.phone ?? '',
          uiMode: profile?.ui_mode ?? 'standard',
        }}
        onSubmit={saveOwnProfile}
      />

      {/* KONFIRMASI KELUAR AKUN */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="w-full max-w-sm bg-white rounded-3xl p-6 border border-ink-200 shadow-2xl space-y-5">
          <DialogHeader className="flex flex-row items-center gap-2.5 pb-3 border-b border-ink-100">
            <span className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-600 shrink-0">
              <LogOut className="w-5 h-5" />
            </span>
            <div className="text-left">
              <DialogTitle className="text-base font-bold text-ink-900 tracking-tight">
                Keluar dari Akun
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-500">
                Anda perlu masuk dan memilih profil lagi setelah ini.
              </DialogDescription>
            </div>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="px-5 py-2 rounded-full text-xs font-semibold text-ink-600 hover:bg-ink-100 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsLogoutDialogOpen(false)
                onLogout?.()
              }}
              className="px-6 py-2 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
            >
              Ya, Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Dashboard
