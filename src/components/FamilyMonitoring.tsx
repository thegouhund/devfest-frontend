import React, { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  Plus,
  Search,
  Bell,
  Video,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { useChat } from '../context/ChatContext'

export interface MonitoredFamilyMember {
  id: string
  name: string
  relation: string
  age: number
  avatarBg: string
  initials: string
  hr: number
  hrv: number
  rr: number
  status: 'Optimal' | 'Normal' | 'Perlu Perhatian' | 'Aktif & Prima'
  signalQuality: number
  lastMeasured: string
  telegramConnected: boolean
  healthNote: string
  hourlyTrend: {
    time: string
    hr: number
    hrv: number
    label: string
    activity?: {
      title: string
      type: 'obat' | 'olahraga' | 'kopi' | 'istirahat'
    }
  }[]
}

const initialFamilyMembers: MonitoredFamilyMember[] = [
  {
    id: 'nenek',
    name: 'Hj. Aminah',
    relation: 'Nenek',
    age: 68,
    avatarBg: 'bg-amber-800',
    initials: 'HA',
    hr: 68,
    hrv: 38,
    rr: 15,
    status: 'Perlu Perhatian',
    signalQuality: 94,
    lastMeasured: '15 menit lalu via rPPG',
    telegramConnected: true,
    healthNote: 'Kelelahan otonom terdeteksi. Jadwal minum obat hipertensi pukul 08:00.',
    hourlyTrend: [
      { time: '06:00', hr: 64, hrv: 42, label: '06:00' },
      { time: '07:00', hr: 66, hrv: 40, label: '07:00' },
      {
        time: '08:00',
        hr: 70,
        hrv: 36,
        label: '08:00',
        activity: { title: 'Minum Obat Hipertensi', type: 'obat' },
      },
      { time: '09:00', hr: 72, hrv: 35, label: '09:00' },
      { time: '10:00', hr: 69, hrv: 38, label: '10:00' },
      { time: '11:00', hr: 68, hrv: 39, label: '11:00' },
      { time: '12:00', hr: 67, hrv: 37, label: '12:00' },
      { time: '13:00', hr: 68, hrv: 38, label: '13:00' },
    ],
  },
  {
    id: 'siti',
    name: 'Siti Rahma',
    relation: 'Ibu',
    age: 39,
    avatarBg: 'bg-rose-800',
    initials: 'SR',
    hr: 74,
    hrv: 49,
    rr: 16,
    status: 'Optimal',
    signalQuality: 96,
    lastMeasured: '32 menit lalu via rPPG',
    telegramConnected: true,
    healthNote: 'Keseimbangan otonom sangat stabil pasca sesi peregangan yoga pagi.',
    hourlyTrend: [
      {
        time: '06:00',
        hr: 78,
        hrv: 44,
        label: '06:00',
        activity: { title: 'Peregangan Yoga', type: 'olahraga' },
      },
      { time: '07:00', hr: 72, hrv: 51, label: '07:00' },
      { time: '08:00', hr: 74, hrv: 50, label: '08:00' },
      { time: '09:00', hr: 76, hrv: 47, label: '09:00' },
      { time: '10:00', hr: 75, hrv: 49, label: '10:00' },
      { time: '11:00', hr: 73, hrv: 52, label: '11:00' },
      { time: '12:00', hr: 74, hrv: 49, label: '12:00' },
      { time: '13:00', hr: 74, hrv: 49, label: '13:00' },
    ],
  },
  {
    id: 'dimas',
    name: 'Dimas Pratama',
    relation: 'Anak',
    age: 12,
    avatarBg: 'bg-indigo-800',
    initials: 'DP',
    hr: 82,
    hrv: 64,
    rr: 19,
    status: 'Aktif & Prima',
    signalQuality: 92,
    lastMeasured: '1 jam lalu via rPPG',
    telegramConnected: true,
    healthNote: 'Metabolisme aktif, daya pemulihan fisik sangat prima.',
    hourlyTrend: [
      { time: '06:00', hr: 75, hrv: 68, label: '06:00' },
      { time: '07:00', hr: 80, hrv: 62, label: '07:00' },
      { time: '08:00', hr: 78, hrv: 65, label: '08:00' },
      { time: '09:00', hr: 85, hrv: 60, label: '09:00' },
      {
        time: '10:00',
        hr: 88,
        hrv: 58,
        label: '10:00',
        activity: { title: 'Aktivitas Bersepeda', type: 'olahraga' },
      },
      { time: '11:00', hr: 83, hrv: 63, label: '11:00' },
      { time: '12:00', hr: 81, hrv: 66, label: '12:00' },
      { time: '13:00', hr: 82, hrv: 64, label: '13:00' },
    ],
  },
]

interface FamilyMonitoringProps {
  onMeasureMember?: (member: MonitoredFamilyMember) => void
  onBackToDashboard?: () => void
}

export const FamilyMonitoring: React.FC<FamilyMonitoringProps> = ({
  onMeasureMember,
  onBackToDashboard,
}) => {
  const { addAiMessage } = useChat()
  const [filter, setFilter] = useState<'semua' | 'perlu-perhatian' | 'optimal'>('semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [members, setMembers] = useState<MonitoredFamilyMember[]>(initialFamilyMembers)
  const [activeAlertToast, setActiveAlertToast] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('Anak')
  const [newMemberAge, setNewMemberAge] = useState('')

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

  // Quick reminder action to Telegram
  const handleSendReminder = (member: MonitoredFamilyMember) => {
    const text = `🔔 Pengingat kesehatan terkirim ke Telegram ${member.name} (${member.relation}): "Tetap jaga hidrasi dan cek berkala denyut nadi Anda."`
    setActiveAlertToast(`Pengingat berhasil dikirim ke Telegram ${member.name}`)
    addAiMessage(text, true)
    setTimeout(() => {
      setActiveAlertToast(null)
    }, 4000)
  }

  // Quick add member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberName.trim()) return

    const newMember: MonitoredFamilyMember = {
      id: Date.now().toString(),
      name: newMemberName.trim(),
      relation: newMemberRole,
      age: Number(newMemberAge) || 25,
      avatarBg: 'bg-teal-800',
      initials: newMemberName
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      hr: 72,
      hrv: 50,
      rr: 16,
      status: 'Normal',
      signalQuality: 95,
      lastMeasured: 'Baru ditambahkan',
      telegramConnected: false,
      healthNote: 'Profil keluarga baru siap dipantau via kamera optik rPPG.',
      hourlyTrend: [
        { time: '06:00', hr: 70, hrv: 52, label: '06:00' },
        { time: '08:00', hr: 73, hrv: 50, label: '08:00' },
        { time: '10:00', hr: 72, hrv: 51, label: '10:00' },
        { time: '12:00', hr: 71, hrv: 53, label: '12:00' },
      ],
    }

    setMembers([...members, newMember])
    setIsAddModalOpen(false)
    setNewMemberName('')
    setNewMemberAge('')
    addAiMessage(
      `Profil baru ${newMember.name} (${newMember.relation}) berhasil didaftarkan ke pemantauan kesehatan keluarga Nadiku.`,
      true
    )
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* 1. TOP HEADER & SUMMARY CONTEXT */}
      <div className="bg-gradient-to-br from-stone-50/80 via-white to-teal-50/30 border border-stone-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/70 border border-teal-200/80 text-teal-900 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse inline-block" />
              Ruang Pemantauan Keluarga
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kondisi Vital Anggota Keluarga
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Pantau stabilitas denyut jantung, ritme saraf otonom (HRV), dan laju pernapasan keluarga
              Anda secara non-invasif. Deteksi dini perubahan pola vital sebelum timbul keluhan.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl border border-stone-200/80 shadow-2xs">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Terpantau:</span>
              <span className="text-sm font-bold text-slate-900">{members.length} Orang</span>
              <span className="text-xs text-stone-300">|</span>
              {attentionCount > 0 ? (
                <Badge variant="warning" className="text-xs font-bold px-2 py-0.5">
                  <AlertTriangle className="w-3 h-3 mr-0.5" />
                  {attentionCount} Perlu Perhatian
                </Badge>
              ) : (
                <Badge variant="success" className="text-xs font-bold px-2 py-0.5">
                  Semua Stabil
                </Badge>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold px-4 py-2.5 shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-teal-300" />
              Tambah Anggota
            </Button>

            {onBackToDashboard && (
              <Button
                size="sm"
                variant="outline"
                onClick={onBackToDashboard}
                className="text-slate-600 hover:text-slate-900 rounded-full font-semibold text-xs px-4 cursor-pointer flex items-center gap-1"
              >
                Dashboard Pribadi
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 mt-5 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Filter:</span>
            <Button
              size="sm"
              variant={filter === 'semua' ? 'default' : 'outline'}
              onClick={() => setFilter('semua')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                filter === 'semua'
                  ? 'bg-slate-900 text-white font-bold shadow-xs hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-stone-100 border-stone-200'
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
                  ? 'bg-teal-700 text-white font-bold shadow-xs hover:bg-teal-800 border-transparent'
                  : 'text-slate-600 hover:bg-stone-100 border-stone-200'
              }`}
            >
              Optimal & Aktif ({optimalCount})
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari nama atau relasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-white text-xs border-stone-200 shadow-2xs h-9"
            />
          </div>
        </div>
      </div>

      {/* Alert toast notification */}
      {activeAlertToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-medium px-5 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{activeAlertToast}</span>
        </div>
      )}

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
              className={`p-5 sm:p-6 rounded-3xl bg-white border transition-shadow duration-200 space-y-4 shadow-sm hover:shadow ${
                isWarning
                  ? 'border-amber-300/80 ring-1 ring-amber-200/50 bg-amber-50/10'
                  : 'border-stone-200/80'
              }`}
            >
              {/* MEMBER HEADER BAR */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <Avatar size="md" className={`${member.avatarBg} text-white font-bold text-sm shadow-xs`}>
                    <AvatarFallback className={`${member.avatarBg} text-white font-bold`}>
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                        {member.name}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-slate-700 font-bold">
                        {member.relation} · {member.age} thn
                      </span>
                      <Badge
                        variant={statusBadgeVariant}
                        className="font-bold text-xs"
                      >
                        {member.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {member.lastMeasured} · Kualitas Sinyal Optik {member.signalQuality}%
                    </p>
                  </div>
                </div>

                {/* Right Header Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSendReminder(member)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border-stone-200 hover:border-teal-700 hover:bg-teal-50/50 text-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 text-teal-700" />
                    Kirim Pengingat
                  </Button>

                  {onMeasureMember && (
                    <Button
                      size="sm"
                      onClick={() => onMeasureMember(member)}
                      className="text-xs font-bold px-4 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5 text-teal-300" />
                      Ukur rPPG
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
                <div className="lg:col-span-7 bg-stone-50/50 border border-stone-200/70 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-teal-700" />
                        Dinamika Vital Sign Hari Ini
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Tren fluktuasi denyut per jam & korelasi ritme otonom
                      </p>
                    </div>

                    {/* Interactive Legend & Baseline Indicator */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                        <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-amber-500' : 'bg-teal-700'}`} />
                        <span className="text-[10px] font-semibold text-slate-600">HR (BPM)</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white px-2 py-0.5 rounded-full border border-stone-200 shadow-2xs">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-[10px] font-semibold text-slate-600">HRV (ms)</span>
                      </div>
                      <span className="text-[10px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 shadow-2xs">
                        Baseline: 70 BPM
                      </span>
                    </div>
                  </div>

                  {/* MUI LINECHART CONTAINER */}
                  <div className="w-full h-[180px] -mx-2">
                    <LineChart
                      xAxis={[
                        {
                          data: member.hourlyTrend.map((d) => d.time),
                          scaleType: 'point',
                          tickLabelStyle: {
                            fontSize: 10,
                            fill: '#64748B',
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
                            fill: '#94A3B8',
                            fontWeight: 500,
                          },
                        },
                      ]}
                      series={[
                        {
                          id: `hr-${member.id}`,
                          data: member.hourlyTrend.map((d) => d.hr),
                          label: 'Detak Nadi (BPM)',
                          color: isWarning ? '#D97706' : '#0E7490',
                          curve: 'natural',
                          showMark: true,
                          area: false,
                        },
                        {
                          id: `hrv-${member.id}`,
                          data: member.hourlyTrend.map((d) => d.hrv),
                          label: 'HRV RMSSD (ms)',
                          color: '#6366F1',
                          curve: 'natural',
                          showMark: true,
                        },
                      ]}
                      height={180}
                      margin={{ top: 10, right: 16, bottom: 24, left: 32 }}
                      grid={{ horizontal: true }}
                      hideLegend
                    >
                      <ChartsReferenceLine
                        y={70}
                        label="Baseline: 70 BPM"
                        labelAlign="start"
                        labelStyle={{ fontSize: 9, fill: '#0D9488', fontWeight: 600 }}
                        lineStyle={{ stroke: '#0D9488', strokeDasharray: '4 4', strokeWidth: 1.5 }}
                      />
                    </LineChart>
                  </div>

                  {/* Activity Markers Pill Bar */}
                  {member.hourlyTrend.some((t) => t.activity) && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-stone-200/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                        Penanda Aktivitas:
                      </span>
                      {member.hourlyTrend
                        .filter((t) => t.activity)
                        .map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs"
                          >
                            <span>{t.activity?.type === 'obat' ? '💊' : t.activity?.type === 'olahraga' ? '🏃' : '☕'}</span>
                            <span className="font-bold">{t.time}</span>
                            <span>·</span>
                            <span>{t.activity?.title}</span>
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Context Health Note in Zone 1 */}
                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5 text-left">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      {member.healthNote}
                    </span>
                    <span className="font-mono text-slate-400 shrink-0 ml-2 hidden sm:inline">
                      Rentang: {Math.min(...member.hourlyTrend.map((t) => t.hr))} -{' '}
                      {Math.max(...member.hourlyTrend.map((t) => t.hr))} BPM
                    </span>
                  </div>
                </div>

                {/* ZONE 2: TALL VERTICAL BOX (PRIMARY METRIC: HEART RATE BPM) */}
                <div className="lg:col-span-2 bg-gradient-to-b from-white to-stone-50/40 border border-stone-200/70 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-2">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Detak Jantung</span>
                    <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                      <Heart className="w-4 h-4 text-rose-600 fill-rose-500 animate-pulse" />
                    </div>
                  </div>

                  {/* Big Number & Unit */}
                  <div className="my-auto py-2">
                    <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                      {member.hr}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-1.5 block">
                      Denyut / Menit
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="w-full pt-2 border-t border-stone-100 flex flex-col items-center gap-1">
                    <Badge
                      variant={statusBadgeVariant}
                      className="font-bold text-xs w-full justify-center text-center py-0.5"
                    >
                      {member.status}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Sensor Optik rPPG
                    </span>
                  </div>
                </div>

                {/* ZONE 3: TWO STACKED HORIZONTAL BOXES (HRV & RESPIRATION) */}
                <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
                  {/* Top Box: Variabilitas HRV */}
                  <div className="flex-1 bg-white border border-stone-200/70 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-sky-600" />
                        Variabilitas (HRV)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">RMSSD</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          {member.hrv}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">ms</span>
                      </div>
                      <Badge
                        variant={member.hrv < 40 ? 'warning' : 'success'}
                        className="font-bold text-[11px]"
                      >
                        {member.hrv >= 50 ? 'Optimal' : member.hrv >= 40 ? 'Sedang' : 'Waspada'}
                      </Badge>
                    </div>

                    <p className="text-[10px] text-slate-500 pt-1 border-t border-stone-100">
                      Keseimbangan saraf simpatik & otonom
                    </p>
                  </div>

                  {/* Bottom Box: Laju Pernapasan (RR) */}
                  <div className="flex-1 bg-white border border-stone-200/70 rounded-2xl p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Wind className="w-3.5 h-3.5 text-teal-600" />
                        Laju Pernapasan
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">12-20 bpm</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          {member.rr}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">bpm</span>
                      </div>
                      <Badge variant="success" className="font-bold text-[11px]">
                        Rileks
                      </Badge>
                    </div>

                    <p className="text-[10px] text-slate-500 pt-1 border-t border-stone-100">
                      Pola respirasi stabil dan teratur
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}

        {filteredMembers.length === 0 && (
          <div className="p-12 text-center bg-stone-50 rounded-3xl border border-dashed border-stone-300 space-y-2">
            <p className="text-sm font-bold text-slate-700">Tidak ada anggota keluarga ditemukan</p>
            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau reset filter kategori.</p>
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
          </div>
        )}
      </div>

      {/* 3. SHADCN DIALOG: TAMBAH ANGGOTA KELUARGA BARU */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-full bg-teal-100 text-teal-800">
                <Plus className="w-4 h-4" />
              </span>
              <DialogTitle className="text-lg font-bold text-slate-900">Tambah Anggota Keluarga</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Daftarkan profil keluarga untuk memantau data vital harian melalui webcam optik rPPG.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="space-y-4 pt-1">
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="memberName" className="text-xs font-bold text-slate-700">
                  Nama Lengkap
                </Label>
                <Input
                  id="memberName"
                  type="text"
                  required
                  placeholder="Contoh: Farhan Pratama"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="text-xs bg-stone-50/80 border-stone-200 rounded-xl px-3 py-2 text-slate-800 focus-visible:ring-teal-700/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="memberRole" className="text-xs font-bold text-slate-700">
                    Hubungan
                  </Label>
                  <select
                    id="memberRole"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    className="w-full h-8 text-xs bg-stone-50/80 border border-stone-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition"
                  >
                    <option value="Kakek">Kakek</option>
                    <option value="Nenek">Nenek</option>
                    <option value="Ayah">Ayah</option>
                    <option value="Ibu">Ibu</option>
                    <option value="Anak">Anak</option>
                    <option value="Saudara">Saudara</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="memberAge" className="text-xs font-bold text-slate-700">
                    Usia (Tahun)
                  </Label>
                  <Input
                    id="memberAge"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="Contoh: 16"
                    value={newMemberAge}
                    onChange={(e) => setNewMemberAge(e.target.value)}
                    className="text-xs bg-stone-50/80 border-stone-200 rounded-xl px-3 py-2 text-slate-800 focus-visible:ring-teal-700/20"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-100 text-[11px] text-teal-900 leading-relaxed flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <span>
                  Pengukuran rPPG keluarga dapat dilakukan kapan saja tanpa login akun terpisah. Cukup pilih profil anggota saat pengukuran.
                </span>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs font-semibold rounded-full px-4 cursor-pointer text-slate-600 hover:text-slate-900"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-slate-900 text-white text-xs font-bold rounded-full px-5 shadow-xs cursor-pointer hover:bg-slate-800"
              >
                Simpan Profil
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FamilyMonitoring
