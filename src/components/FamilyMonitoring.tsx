import React, { useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Chip,
  Modal,
} from '@heroui/react'
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
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{
    memberId: string
    pointIndex: number
  } | null>(null)
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

  // SVG Chart Geometry Constants
  const chartWidth = 560
  const chartHeight = 160
  const padLeft = 32
  const padRight = 20
  const padTop = 18
  const padBottom = 26
  const plotW = chartWidth - padLeft - padRight
  const plotH = chartHeight - padTop - padBottom
  const minVal = 55
  const maxVal = 95

  const getYCoord = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val))
    return padTop + plotH - ((clamped - minVal) / (maxVal - minVal)) * plotH
  }

  const getXCoord = (idx: number, total: number) => {
    return padLeft + (idx / (total - 1)) * plotW
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200">
      {/* 1. TOP HEADER & SUMMARY CONTEXT (Open area in sketch) */}
      <div className="bg-gradient-to-br from-stone-50/90 via-white to-teal-50/40 border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs">
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
              <span className="text-xs text-slate-500 font-medium">Terpantau:</span>
              <span className="text-sm font-bold text-slate-900">{members.length} Orang</span>
              <span className="text-xs text-stone-300">|</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/80">
                1 Perlu Perhatian
              </span>
            </div>

            <Button
              size="sm"
              variant="primary"
              onPress={() => setIsAddModalOpen(true)}
              className="bg-slate-900 text-white rounded-full font-bold px-5 py-2.5 shadow-xs hover:bg-slate-800 transition text-xs cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Anggota
            </Button>

            {onBackToDashboard && (
              <Button
                size="sm"
                variant="ghost"
                onPress={onBackToDashboard}
                className="text-slate-600 hover:text-slate-900 rounded-full font-semibold text-xs px-4 cursor-pointer"
              >
                Dashboard Pribadi ↗
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
              variant={filter === 'semua' ? 'primary' : 'ghost'}
              onPress={() => setFilter('semua')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                filter === 'semua'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-stone-100'
              }`}
            >
              Semua ({members.length})
            </Button>
            <Button
              size="sm"
              variant={filter === 'perlu-perhatian' ? 'primary' : 'ghost'}
              onPress={() => setFilter('perlu-perhatian')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                filter === 'perlu-perhatian'
                  ? 'bg-amber-700 text-white font-bold shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Perlu Perhatian (1)
            </Button>
            <Button
              size="sm"
              variant={filter === 'optimal' ? 'primary' : 'ghost'}
              onPress={() => setFilter('optimal')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                filter === 'optimal'
                  ? 'bg-teal-700 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-stone-100'
              }`}
            >
              Optimal & Aktif ({members.filter((m) => m.status !== 'Perlu Perhatian').length})
            </Button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari nama atau relasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs bg-white border border-stone-200 rounded-full px-4 py-2 pl-9 text-slate-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 shadow-2xs"
            />
            <svg
              className="w-4 h-4 text-stone-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
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

      {/* 2. FAMILY CARDS LIST (ACCORDING TO USER'S SKETCH) */}
      <div className="space-y-6">
        {filteredMembers.map((member) => {
          const isWarning = member.status === 'Perlu Perhatian'
          const statusBadgeColor: 'warning' | 'accent' | 'success' = isWarning
            ? 'warning'
            : member.status === 'Aktif & Prima'
            ? 'accent'
            : 'success'

          const points = member.hourlyTrend
            .map((pt, idx) => `${getXCoord(idx, member.hourlyTrend.length)},${getYCoord(pt.hr)}`)
            .join(' ')

          const areaPoints = `${getXCoord(0, member.hourlyTrend.length)},${padTop + plotH} ${points} ${getXCoord(
            member.hourlyTrend.length - 1,
            member.hourlyTrend.length
          )},${padTop + plotH}`

          return (
            <Card
              key={member.id}
              className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all duration-200 shadow-xs space-y-4 hover:shadow-md ${
                isWarning
                  ? 'border-amber-200/90 ring-1 ring-amber-200/50'
                  : 'border-stone-200/90'
              }`}
            >
              {/* MEMBER HEADER BAR (The "NENEK" label area from the sketch) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <Avatar size="md" className={`${member.avatarBg} text-white font-bold text-sm shadow-xs`}>
                    <Avatar.Fallback>{member.initials}</Avatar.Fallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                        {member.name}
                      </h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-slate-700 font-bold">
                        {member.relation} · {member.age} thn
                      </span>
                      <Chip
                        size="sm"
                        color={statusBadgeColor}
                        variant="soft"
                        className="font-bold text-xs"
                      >
                        {member.status}
                      </Chip>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {member.lastMeasured} · Sinyal Optik {member.signalQuality}%
                    </p>
                  </div>
                </div>

                {/* Right Header Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => handleSendReminder(member)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border-stone-200 hover:border-teal-700 hover:bg-teal-50/50 text-slate-700 cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Kirim Pengingat
                  </Button>

                  {onMeasureMember && (
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => onMeasureMember(member)}
                      className="text-xs font-bold px-4 py-1.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 shadow-2xs cursor-pointer flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Ukur rPPG
                    </Button>
                  )}
                </div>
              </div>

              {/* CARD BODY: 3-ZONE LAYOUT MATCHING USER'S SKETCH
                  Zone 1: Wide Box (Left ~58%) -> Vital Dynamic Wave Chart
                  Zone 2: Tall Box (Middle ~22%) -> Primary Heart Rate BPM
                  Zone 3: 2 Stacked Boxes (Right ~20%) -> Top: HRV RMSSD, Bottom: Respiration Rate
              */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* ZONE 1: WIDE HORIZONTAL BOX (TREND CHART & DYNAMICS) */}
                <div className="lg:col-span-7 bg-stone-50/60 border border-stone-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Dinamika Vital Sign Hari Ini
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Garis tren fluktuasi denyut per jam & penanda aktivitas
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-stone-200 shadow-2xs">
                        Baseline: <strong className="text-slate-800 font-bold">70 BPM</strong>
                      </span>
                    </div>
                  </div>

                  {/* SVG Chart Area */}
                  <div className="w-full overflow-x-auto py-1">
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="w-full min-w-[380px] h-[120px] select-none overflow-visible"
                    >
                      <defs>
                        <linearGradient id={`grad-${member.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={isWarning ? '#D97706' : '#0D9488'}
                            stopOpacity="0.22"
                          />
                          <stop
                            offset="100%"
                            stopColor={isWarning ? '#D97706' : '#0D9488'}
                            stopOpacity="0.0"
                          />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      {[60, 70, 80, 90].map((val) => {
                        const y = getYCoord(val)
                        return (
                          <g key={val}>
                            <line
                              x1={padLeft}
                              y1={y}
                              x2={padLeft + plotW}
                              y2={y}
                              stroke="#E7E5E4"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={padLeft - 6}
                              y={y + 3}
                              textAnchor="end"
                              className="text-[9px] fill-slate-400 font-mono font-medium"
                            >
                              {val}
                            </text>
                          </g>
                        )
                      })}

                      {/* Baseline Dashed Line (70 BPM) */}
                      <line
                        x1={padLeft}
                        y1={getYCoord(70)}
                        x2={padLeft + plotW}
                        y2={getYCoord(70)}
                        stroke="#0D9488"
                        strokeWidth="1.2"
                        strokeDasharray="4 4"
                      />

                      {/* Area Under Curve */}
                      <polygon points={areaPoints} fill={`url(#grad-${member.id})`} />

                      {/* Line Chart */}
                      <polyline
                        fill="none"
                        stroke={isWarning ? '#D97706' : '#0D9488'}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={points}
                      />

                      {/* Data Points and Interactivity */}
                      {member.hourlyTrend.map((pt, idx) => {
                        const cx = getXCoord(idx, member.hourlyTrend.length)
                        const cy = getYCoord(pt.hr)
                        const isHovered =
                          hoveredChartPoint?.memberId === member.id &&
                          hoveredChartPoint?.pointIndex === idx

                        return (
                          <g
                            key={idx}
                            className="cursor-pointer"
                            onMouseEnter={() =>
                              setHoveredChartPoint({ memberId: member.id, pointIndex: idx })
                            }
                            onMouseLeave={() => setHoveredChartPoint(null)}
                          >
                            <circle
                              cx={cx}
                              cy={cy}
                              r={isHovered ? 5 : 3.5}
                              className={`transition-all duration-150 ${
                                isHovered
                                  ? 'fill-slate-900 stroke-white stroke-2'
                                  : isWarning
                                  ? 'fill-white stroke-amber-600 stroke-2'
                                  : 'fill-white stroke-teal-700 stroke-2'
                              }`}
                            />

                            {/* X-axis time label */}
                            <text
                              x={cx}
                              y={padTop + plotH + 16}
                              textAnchor="middle"
                              className="text-[9px] fill-slate-500 font-medium"
                            >
                              {pt.label}
                            </text>

                            {/* Activity Event Badge */}
                            {pt.activity && (
                              <g>
                                <circle
                                  cx={cx}
                                  cy={cy - 16}
                                  r="9"
                                  className="fill-white stroke-amber-400 stroke-1.5 shadow-2xs"
                                />
                                <text
                                  x={cx}
                                  y={cy - 13}
                                  textAnchor="middle"
                                  className="text-[9px]"
                                >
                                  {pt.activity.type === 'obat' ? '💊' : '🏃'}
                                </text>
                              </g>
                            )}

                            {/* Hover Tooltip */}
                            {isHovered && (
                              <g>
                                <rect
                                  x={cx - 36}
                                  y={cy - 36}
                                  width="72"
                                  height="24"
                                  rx="6"
                                  className="fill-slate-900 shadow-md"
                                />
                                <text
                                  x={cx}
                                  y={cy - 20}
                                  textAnchor="middle"
                                  className="text-[10px] fill-white font-bold"
                                >
                                  {pt.hr} BPM ({pt.time})
                                </text>
                              </g>
                            )}
                          </g>
                        )
                      })}
                    </svg>
                  </div>

                  {/* Context Note in Zone 1 */}
                  <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block" />
                      {member.healthNote}
                    </span>
                    <span className="font-mono text-slate-400 shrink-0 ml-2">
                      Rentang: {Math.min(...member.hourlyTrend.map((t) => t.hr))} -{' '}
                      {Math.max(...member.hourlyTrend.map((t) => t.hr))} BPM
                    </span>
                  </div>
                </div>

                {/* ZONE 2: TALL VERTICAL BOX (PRIMARY METRIC: HEART RATE BPM) */}
                <div className="lg:col-span-2 bg-gradient-to-b from-white via-white to-stone-50 border border-stone-200/80 rounded-2xl p-4 flex flex-col items-center justify-between text-center space-y-2">
                  <div className="w-full flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Detak Jantung</span>
                    <div className="w-7 h-7 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-rose-600 animate-pulse"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </div>
                  </div>

                  {/* Big Number & Unit */}
                  <div className="my-auto py-2">
                    <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                      {member.hr}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mt-1 block">
                      Denyut / Menit
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="w-full pt-2 border-t border-stone-100 flex flex-col items-center gap-1">
                    <Chip
                      size="sm"
                      color={statusBadgeColor}
                      variant="soft"
                      className="font-bold text-xs w-full text-center"
                    >
                      {member.status}
                    </Chip>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Sensor Optik rPPG
                    </span>
                  </div>
                </div>

                {/* ZONE 3: TWO STACKED HORIZONTAL BOXES (HRV & RESPIRATION) */}
                <div className="lg:col-span-3 flex flex-col gap-3 justify-between">
                  {/* Top Box: Variabilitas HRV */}
                  <div className="flex-1 bg-white border border-stone-200/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
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
                      <Chip
                        size="sm"
                        color={member.hrv < 40 ? 'warning' : 'success'}
                        variant="soft"
                        className="font-bold text-[11px]"
                      >
                        {member.hrv >= 50 ? 'Optimal' : member.hrv >= 40 ? 'Sedang' : 'Waspada'}
                      </Chip>
                    </div>

                    <p className="text-[10px] text-slate-500 pt-1 border-t border-stone-100">
                      Keseimbangan saraf simpatik & otonom
                    </p>
                  </div>

                  {/* Bottom Box: Laju Pernapasan (RR) */}
                  <div className="flex-1 bg-white border border-stone-200/80 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        Laju Pernapasan
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">12-20</span>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          {member.rr}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">bpm</span>
                      </div>
                      <Chip size="sm" color="success" variant="soft" className="font-bold text-[11px]">
                        Rileks
                      </Chip>
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
              onPress={() => {
                setFilter('semua')
                setSearchQuery('')
              }}
              className="mt-2 text-xs rounded-full"
            >
              Reset Filter
            </Button>
          </div>
        )}
      </div>

      {/* 3. MODAL: TAMBAH ANGGOTA KELUARGA BARU */}
      <Modal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <Modal.Backdrop className="bg-slate-900/40 backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center p-4">
          <Modal.Container className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200">
            <Modal.Dialog className="space-y-5">
              <Modal.Header>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-full bg-teal-100 text-teal-800">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">Tambah Anggota Keluarga</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Daftarkan profil keluarga untuk memantau data vital harian melalui webcam optik rPPG.
                </p>
              </Modal.Header>

              <form onSubmit={handleAddMember} className="space-y-4">
                <Modal.Body className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Farhan Pratama"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Hubungan</label>
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                      >
                        <option value="Kakek">Kakek</option>
                        <option value="Nenek">Nenek</option>
                        <option value="Ayah">Ayah</option>
                        <option value="Ibu">Ibu</option>
                        <option value="Anak">Anak</option>
                        <option value="Saudara">Saudara</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Usia (Tahun)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        placeholder="Contoh: 16"
                        value={newMemberAge}
                        onChange={(e) => setNewMemberAge(e.target.value)}
                        className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 text-[11px] text-teal-900 leading-relaxed">
                    💡 Pengukuran rPPG keluarga dapat dilakukan kapan saja tanpa login akun terpisah. Cukup pilih profil anggota saat pengukuran.
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onPress={() => setIsAddModalOpen(false)}
                    className="text-xs font-semibold rounded-full px-4"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="bg-slate-900 text-white text-xs font-bold rounded-full px-5 shadow-xs"
                  >
                    Simpan Profil
                  </Button>
                </Modal.Footer>
              </form>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}

export default FamilyMonitoring
