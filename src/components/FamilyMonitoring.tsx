import React, { useState, useEffect, useCallback } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge, Chip } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { LineChart } from '@mui/x-charts'
import {
  Heart,
  Activity,
  Wind,
  Plus,
  Search,

  UserPen,
  Sparkles,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '@/lib/api'
import {
  ageFrom,
  createProfile,
  updateProfile,
  getFamilyDashboard,
  initialsFrom,
  listProfiles,
} from '@/lib/auth-api'
import { getVitalsTrend } from '@/lib/health-api'
import { ProfileFormDialog, type ProfileFormValues } from './ProfileFormDialog'

const genderLabel = (gender: string | null): 'Laki-laki' | 'Perempuan' | undefined => {
  const value = gender?.toLowerCase()
  if (value === 'male' || value === 'laki-laki') return 'Laki-laki'
  if (value === 'female' || value === 'perempuan') return 'Perempuan'
  return undefined
}

const genderToApi = (label: 'Laki-laki' | 'Perempuan') =>
  label === 'Perempuan' ? 'female' : 'male'

/** Status diturunkan dari jumlah anomali terbuka milik profil itu. */
const statusFor = (
  openAnomalies: number,
  hasMeasurement: boolean
): MonitoredFamilyMember['status'] => {
  if (openAnomalies > 0) return 'Perlu Perhatian'
  if (!hasMeasurement) return 'Normal'
  return 'Optimal'
}

const healthNoteFor = (openAnomalies: number | null, hasMeasurement: boolean) => {
  if (openAnomalies === null) return 'Data vital disembunyikan oleh setelan privasi profil ini.'
  if (!hasMeasurement) return 'Belum ada pengukuran rPPG untuk profil ini.'
  if (openAnomalies > 0) {
    return `${openAnomalies} anomali belum ditinjau. Buka Riwayat untuk detailnya.`
  }
  return 'Tidak ada anomali terbuka pada pemantauan terakhir.'
}

const relativeTime = (iso: string | null) => {
  if (!iso) return 'Belum pernah diukur'
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.round(hours / 24)} hari lalu`
}

export interface MonitoredFamilyMember {
  id: string
  name: string
  relation: string
  role: 'admin' | 'member'
  age: number
  dateOfBirth?: string
  gender?: 'Laki-laki' | 'Perempuan'
  heightCm?: number
  weightKg?: number
  hasPin?: boolean
  uiMode: 'standard' | 'elderly'
  avatarBg: string
  initials: string
  /** null kalau profil ini belum punya pengukuran apa pun. */
  hr: number | null
  hrv: number | null
  rr: number | null
  status: 'Optimal' | 'Normal' | 'Perlu Perhatian' | 'Aktif & Prima'
  lastMeasured: string
  healthNote: string
  /** true kalau data vitalnya disembunyikan setelan privasi profil itu. */
  isPrivate: boolean
  openAnomalies: number
  /** Rata-rata harian 7 hari terakhir; kosong kalau belum ada data. */
  hourlyTrend: {
    time: string
    hr: number
    hrv: number
    label: string
  }[]
}

export const FamilyMonitoring: React.FC = () => {
  const { addAiMessage } = useChat()
  const { profile } = useAuth()
  const [filter, setFilter] = useState<'semua' | 'perlu-perhatian' | 'optimal'>('semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [members, setMembers] = useState<MonitoredFamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editing, setEditing] = useState<MonitoredFamilyMember | null>(null)

  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      // /profiles memuat seluruh anggota akun; /dashboard/family hanya yang
      // datanya boleh dilihat. Selisihnya berarti profil privat.
      const [profiles, dashboard] = await Promise.all([listProfiles(), getFamilyDashboard()])
      const active = profiles.filter((p) => p.is_active)
      const summaries = new Map(dashboard.map((d) => [d.family_member_id, d]))

      const now = new Date()
      const from = new Date()
      from.setDate(now.getDate() - 6)
      const range = { start: from.toISOString(), end: now.toISOString() }

      // Tren tidak tersedia dalam satu panggilan untuk banyak profil, jadi
      // dua request per anggota yang datanya boleh dilihat.
      const trends = await Promise.all(
        active.map(async (profile) => {
          if (!summaries.has(profile.id)) return null
          const [hr, hrv] = await Promise.all([
            getVitalsTrend('heart_rate', { ...range, bucket: 'day', family_member_id: profile.id }),
            getVitalsTrend('hrv_rmssd', { ...range, bucket: 'day', family_member_id: profile.id }),
          ]).catch(() => [null, null] as const)
          if (!hr) return null
          const hrvByBucket = new Map(hrv?.buckets.map((b) => [b.bucket, b.avg]) ?? [])
          return hr.buckets.map((b) => ({
            time: b.bucket,
            label: new Date(b.bucket).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            }),
            hr: Math.round(b.avg),
            hrv: Math.round(hrvByBucket.get(b.bucket) ?? 0),
          }))
        })
      )

      setMembers(
        active.map((profile, i) => {
          const summary = summaries.get(profile.id)
          const latest = new Map(summary?.latest.map((r) => [r.metric_type, r.value]) ?? [])
          const openAnomalies = summary?.open_anomalies ?? 0
          const round = (v: number | undefined) => (v === undefined ? null : Math.round(v))

          return {
            id: profile.id,
            name: profile.full_name,
            relation: profile.relationship_label ?? (profile.role === 'admin' ? 'Admin' : 'Anggota'),
            role: profile.role,
            age: ageFrom(profile.date_of_birth) ?? 0,
            dateOfBirth: profile.date_of_birth ?? undefined,
            gender: genderLabel(profile.gender),
            heightCm: profile.height_cm ?? undefined,
            weightKg: profile.weight ?? undefined,
            hasPin: profile.has_pin,
            uiMode: profile.ui_mode,
            avatarBg: profile.role === 'admin' ? 'bg-clay-700' : 'bg-sage-700',
            initials: initialsFrom(profile.full_name),
            hr: round(latest.get('heart_rate')),
            hrv: round(latest.get('hrv_rmssd')),
            rr: round(latest.get('respiration_rate')),
            status: statusFor(openAnomalies, latest.has('heart_rate')),
            lastMeasured: relativeTime(summary?.last_measurement_at ?? null),
            healthNote: healthNoteFor(summary ? openAnomalies : null, latest.has('heart_rate')),
            isPrivate: !summary,
            openAnomalies,
            hourlyTrend: trends[i] ?? [],
          }
        })
      )
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Gagal memuat profil keluarga')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchesFilter =
      filter === 'semua'
        ? true
        : filter === 'perlu-perhatian'
        ? m.status === 'Perlu Perhatian'
        : m.status === 'Optimal' || m.status === 'Aktif & Prima' || m.status === 'Normal'
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.relation.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const attentionCount = members.filter((m) => m.status === 'Perlu Perhatian').length
  const optimalCount = members.filter((m) => m.status !== 'Perlu Perhatian').length

  const handleAddMember = async (values: ProfileFormValues) => {
    // `role` tidak diterima endpoint ini — backend selalu membuat anggota biasa.
    const created = await createProfile({
      full_name: values.fullName.trim(),
      date_of_birth: values.dateOfBirth || null,
      gender: genderToApi(values.gender),
      relationship_label: values.relation || null,
      height_cm: parseFloat(values.height) || null,
      weight: parseFloat(values.weight) || null,
      ui_mode: values.uiMode,
      pin: values.pin.trim() || null,
    })

    await reload()
    addAiMessage(
      `Profil ${created.full_name}${
        created.relationship_label ? ` (${created.relationship_label})` : ''
      }${created.has_pin ? ', terkunci PIN' : ''} berhasil ditambahkan ke keluarga.`,
      true
    )
  }

  const handleEditMember = async (values: ProfileFormValues) => {
    if (!editing) return
    await updateProfile(editing.id, {
      full_name: values.fullName.trim(),
      date_of_birth: values.dateOfBirth || null,
      gender: genderToApi(values.gender),
      relationship_label: values.relation || null,
      height_cm: parseFloat(values.height) || null,
      weight: parseFloat(values.weight) || null,
      ui_mode: values.uiMode,
    })
    setEditing(null)
    await reload()
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* 1. TOP HEADER (Canvas style, matches Aktivitas & other menus) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
            Keluarga
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            Pantau stabilitas denyut jantung, ritme saraf otonom (HRV), dan laju pernapasan keluarga Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Chip size="sm" color="accent" variant="soft" className="font-semibold text-xs">
            {members.length} Anggota Keluarga
          </Chip>
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="bg-ink-900 hover:bg-ink-800 text-white rounded-full font-bold px-4 py-2 text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-sage-300" />
            Tambah Anggota
          </Button>
        </div>
      </div>

      {/* 2. FILTER & SEARCH CONTROLS CARD */}
      <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-ink-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink-100">
          <div>
            <h2 className="text-base font-bold text-ink-900 tracking-tight">Kondisi Anggota Keluarga</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              Menampilkan {filteredMembers.length} dari {members.length} anggota keluarga terdaftar.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari nama atau relasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-white text-xs border-ink-200 shadow-2xs h-9"
            />
          </div>
        </div>

        {/* Filter status */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-ink-500 mr-1">Filter:</span>
          <Button
            size="sm"
            variant={filter === 'semua' ? 'default' : 'outline'}
            onClick={() => setFilter('semua')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
              filter === 'semua'
                ? 'bg-ink-900 text-white font-bold shadow-xs hover:bg-ink-800'
                : 'text-ink-600 hover:bg-ink-100 border-ink-200'
            }`}
          >
            Semua ({members.length})
          </Button>
          <Button
            size="sm"
            variant={filter === 'perlu-perhatian' ? 'default' : 'outline'}
            onClick={() => setFilter('perlu-perhatian')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
              filter === 'perlu-perhatian'
                ? 'bg-amber-700 text-white font-bold shadow-xs hover:bg-amber-800 border-transparent'
                : 'text-amber-700 hover:bg-amber-50 border-amber-200'
            }`}
          >
            Perlu Perhatian ({attentionCount})
          </Button>
          <Button
            size="sm"
            variant={filter === 'optimal' ? 'default' : 'outline'}
            onClick={() => setFilter('optimal')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
              filter === 'optimal'
                ? 'bg-sage-700 text-white font-bold shadow-xs hover:bg-sage-800 border-transparent'
                : 'text-ink-600 hover:bg-ink-100 border-ink-200'
            }`}
          >
            Optimal & Aktif ({optimalCount})
          </Button>
        </div>
      </Card>

      {/* 2. FAMILY CARDS LIST (3-ZONE CLINICAL MONITORING CARDS) */}
      <div className="space-y-6">
        {filteredMembers.map((member) => {
          const isWarning = member.status === 'Perlu Perhatian'
          const statusBadgeVariant = isWarning
            ? 'warning'
            : member.status === 'Aktif & Prima'
            ? 'soft'
            : 'success'

          return (
            <Card
              key={member.id}
              className={`p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border shadow-xs hover:shadow-md transition-shadow space-y-4 ${
                isWarning
                  ? 'border-amber-300/80'
                  : 'border-ink-200/80'
              }`}
            >
              {/* MEMBER HEADER BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-ink-100">
                <div className="flex items-center gap-3">
                  <Avatar size="md" className={`${member.avatarBg} text-white font-bold text-sm shadow-xs`}>
                    <AvatarFallback className={`${member.avatarBg} text-white font-bold`}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-ink-900 tracking-tight">
                        {member.name}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-ink-100 text-ink-700 font-bold">
                        {member.relation} · {member.age} thn
                      </span>
                      {/* Role Badge (FR-6.4) */}
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          member.role === 'admin'
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                            : 'bg-ink-100/80 border-ink-200 text-ink-600'
                        }`}
                      >
                        {member.role === 'admin' ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-indigo-600" />
                            Admin
                          </>
                        ) : (
                          'Member'
                        )}
                      </span>
                      {/* Optional PIN Protection Badge (FR-6.3) */}
                      {member.hasPin && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold" title="Profil dilindungi PIN">
                          <Lock className="w-2.5 h-2.5 text-amber-600" />
                          PIN
                        </span>
                      )}
                      <Badge
                        variant={statusBadgeVariant}
                        className="font-bold text-xs"
                      >
                        {member.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-500 mt-0.5">
                      <span>Diukur {member.lastMeasured}</span>
                      {(member.gender || member.heightCm || member.weightKg) && (
                        <span className="text-ink-400 font-medium">
                          • {[
                            member.gender,
                            member.heightCm ? `${member.heightCm} cm` : null,
                            member.weightKg ? `${member.weightKg} kg` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Header Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {/* PATCH /profiles/{id} hanya untuk profil sendiri atau admin. */}
                  {(profile?.role === 'admin' || profile?.id === member.id) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditing(member)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border-ink-200 text-ink-700 hover:bg-ink-100 cursor-pointer flex items-center gap-1.5"
                    >
                      <UserPen className="w-3.5 h-3.5 text-ink-500" />
                      Edit
                    </Button>
                  )}
              </div>
              </div>

              {/* CARD BODY: 3-ZONE LAYOUT
                  Zone 1: Wide Box (Left ~58%) -> MUI LineChart for Vital Trends & Activity Markers
                  Zone 2: Tall Box (Middle ~22%) -> Primary Heart Rate BPM
                  Zone 3: 2 Stacked Boxes (Right ~20%) -> HRV RMSSD & Respiration Rate
              */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* ZONE 1: WIDE HORIZONTAL BOX (MUI LINECHART TREND) */}
                <div className="lg:col-span-7 bg-ink-50/70 border border-ink-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-sage-700" />
                        Dinamika Vital Sign Hari Ini
                      </span>
                      <p className="text-[11px] text-ink-500 mt-0.5">
                        Tren fluktuasi denyut per jam & korelasi ritme otonom
                      </p>
                    </div>

                    {/* Interactive Legend & Baseline Indicator */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-ink-200 shadow-2xs">
                        <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-amber-500' : 'bg-sage-700'}`} />
                        <span className="text-[10px] font-semibold text-ink-600">HR (BPM)</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-ink-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-clay-500" />
                        <span className="text-[10px] font-semibold text-ink-600">HRV (ms)</span>
                      </div>
                      <span className="text-[10px] font-semibold text-sage-800 bg-sage-50 px-2 py-0.5 rounded-full border border-sage-200 shadow-2xs">
                        Rata-rata 7 hari
                      </span>
                    </div>
                  </div>

                  {/* MUI LINECHART CONTAINER */}
                  <div className="w-full h-[180px] -mx-2">
                    <LineChart
                      xAxis={[
                        {
                          data: member.hourlyTrend.map((d) => d.label),
                          scaleType: 'point',
                          tickLabelStyle: {
                            fontSize: 10,
                            fill: '#7D7264',
                            fontWeight: 500,
                          },
                        },
                      ]}
                      yAxis={[
                        {
                          min: 50,
                          max: 95,
                          tickLabelStyle: {
                            fontSize: 9,
                            fill: '#A79A88',
                            fontWeight: 500,
                          },
                        },
                      ]}
                      series={[
                        {
                          id: `hr-${member.id}`,
                          data: member.hourlyTrend.map((d) => d.hr),
                          label: 'Detak Nadi (BPM)',
                          color: isWarning ? '#D97706' : '#C2643B',
                          curve: 'natural',
                          showMark: true,
                          area: false,
                        },
                        {
                          id: `hrv-${member.id}`,
                          data: member.hourlyTrend.map((d) => d.hrv),
                          label: 'HRV RMSSD (ms)',
                          color: '#62755A',
                          curve: 'natural',
                          showMark: true,
                        },
                      ]}
                      height={180}
                      margin={{ top: 10, right: 16, bottom: 24, left: 32 }}
                      grid={{ horizontal: true }}
                      hideLegend
                    >
                    </LineChart>
                  </div>

                  {/* Context Health Note in Zone 1 */}
                  <div className="pt-2 border-t border-ink-200/60 flex items-center justify-between text-[11px] text-ink-500">
                    <span className="flex items-center gap-1.5 text-left">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      {member.healthNote}
                    </span>
                    <span className="font-mono text-ink-400 shrink-0 ml-2 hidden sm:inline">
                      {member.hourlyTrend.length > 0
                        ? `Rentang: ${Math.min(...member.hourlyTrend.map((t) => t.hr))} - ${Math.max(
                            ...member.hourlyTrend.map((t) => t.hr)
                          )} BPM`
                        : 'Belum ada tren'}
                    </span>
                  </div>
                </div>

                {/* ZONE 2: TALL VERTICAL BOX (PRIMARY METRIC: HEART RATE BPM) */}
                <div className="lg:col-span-2 bg-ink-50/70 border border-ink-200/80 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-2">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-700">Detak Jantung</span>
                    <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Big Number & Unit */}
                  <div className="my-auto py-2">
                    <div className="text-4xl sm:text-5xl font-extrabold text-ink-900 tracking-tight leading-none">
                      {member.hr ?? '—'}
                    </div>
                    <span className="text-[11px] font-bold text-ink-400 tracking-wider uppercase mt-1.5 block">
                      Denyut / Menit
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="w-full pt-2 border-t border-ink-100 flex flex-col items-center gap-1">
                    <Badge
                      variant={statusBadgeVariant}
                      className="font-bold text-xs w-full justify-center text-center py-0.5"
                    >
                      {member.status}
                    </Badge>
                    <span className="text-[10px] text-ink-400 font-medium">
                      Sensor Optik rPPG
                    </span>
                  </div>
                </div>

                {/* ZONE 3: TWO STACKED HORIZONTAL BOXES (HRV & RESPIRATION) */}
                <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
                  {/* Top Box: Variabilitas HRV */}
                  <div className="flex-1 bg-white border border-ink-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-sage-600" />
                        Variabilitas (HRV)
                      </span>
                      <span className="text-[10px] text-ink-400 font-mono">RMSSD</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-ink-900 tracking-tight">
                          {member.hrv ?? '—'}
                        </span>
                        <span className="text-xs font-semibold text-ink-400">ms</span>
                      </div>
                      <Badge
                        variant={(member.hrv ?? 0) < 40 ? 'warning' : 'success'}
                        className="font-bold text-[11px]"
                      >
                        {member.hrv === null
                          ? 'Belum ada data'
                          : member.hrv >= 50
                          ? 'Optimal'
                          : member.hrv >= 40
                          ? 'Sedang'
                          : 'Waspada'}
                      </Badge>
                    </div>

                    <p className="text-[10px] text-ink-500 pt-1 border-t border-ink-100">
                      Keseimbangan saraf simpatik & otonom
                    </p>
                  </div>

                  {/* Bottom Box: Laju Pernapasan (RR) */}
                  <div className="flex-1 bg-white border border-ink-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink-700 flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-sage-600" />
                        Laju Pernapasan
                      </span>
                      <span className="text-[10px] text-ink-400 font-mono">12-20 bpm</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-ink-900 tracking-tight">
                          {member.rr ?? '—'}
                        </span>
                        <span className="text-xs font-semibold text-ink-400">bpm</span>
                      </div>
                      <Badge variant="success" className="font-bold text-[11px]">
                        Rileks
                      </Badge>
                    </div>

                    <p className="text-[10px] text-ink-500 pt-1 border-t border-ink-100">
                      Pola respirasi stabil dan teratur
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}

        {filteredMembers.length === 0 && (
          <div className="p-12 text-center bg-ink-50 rounded-3xl border border-dashed border-ink-300 space-y-2">
            {isLoading ? (
              <p className="text-sm font-medium text-ink-400">Memuat profil keluarga…</p>
            ) : loadError ? (
              <>
                <p className="text-sm font-bold text-amber-700">{loadError}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void reload()}
                  className="mt-2 text-xs rounded-full cursor-pointer"
                >
                  Coba lagi
                </Button>
              </>
            ) : (
              <>
            <p className="text-sm font-bold text-ink-700">Tidak ada anggota keluarga ditemukan</p>
            <p className="text-xs text-ink-500">Coba ubah kata kunci pencarian atau reset filter kategori.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setFilter('semua')
                setSearchQuery('')
              }}
              className="mt-2 text-xs rounded-full cursor-pointer"
            >
              Reset Filter
            </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. SHADCN DIALOG: TAMBAH ANGGOTA KELUARGA BARU (ERD §2.2 & PRD FR-6) */}
      <ProfileFormDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        mode="create"
        onSubmit={handleAddMember}
      />

      <ProfileFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        mode="edit"
        initial={
          editing
            ? {
                fullName: editing.name,
                relation: editing.relation,
                dateOfBirth: editing.dateOfBirth ?? '',
                gender: editing.gender ?? 'Laki-laki',
                height: editing.heightCm ? String(editing.heightCm) : '',
                weight: editing.weightKg ? String(editing.weightKg) : '',
                uiMode: editing.uiMode,
              }
            : undefined
        }
        onSubmit={handleEditMember}
      />
    </div>
  )
}

export default FamilyMonitoring
