import React, { useState } from 'react'
import {
  Avatar,
  Button,
  ButtonGroup,
  Card,
  Chip,
  Dropdown,
  Input,
  Label,
  Modal,
  Switch,
  TextField,
} from '@heroui/react'
import vitalMonitoringIllustration from '../assets/illustrations/vital-monitoring.svg'
import { useChat } from '../context/ChatContext'

interface ActivityItem {
  id: string
  category: 'kopi' | 'olahraga' | 'tidur' | 'rokok' | 'makan' | 'alkohol'
  title: string
  detail: string
  time: string
  timestamp: number // for chart positioning
}

export interface FamilyMember {
  id: string
  name: string
  role: string
  initials: string
  age: number
  avatarBg: string
  hr: number
  hrv: number
  rr: number
  status: string
  signalQuality: number
}

const familyMembers: FamilyMember[] = [
  {
    id: 'budi',
    name: 'Budi Pratama',
    role: 'Kepala Keluarga',
    initials: 'BP',
    age: 42,
    avatarBg: 'bg-teal-900',
    hr: 72,
    hrv: 52,
    rr: 16,
    status: 'Normal',
    signalQuality: 98,
  },
  {
    id: 'siti',
    name: 'Siti Rahma',
    role: 'Ibu',
    initials: 'SR',
    age: 39,
    avatarBg: 'bg-rose-800',
    hr: 75,
    hrv: 48,
    rr: 17,
    status: 'Optimal',
    signalQuality: 95,
  },
  {
    id: 'dimas',
    name: 'Dimas Pratama',
    role: 'Anak',
    initials: 'DP',
    age: 12,
    avatarBg: 'bg-indigo-800',
    hr: 82,
    hrv: 64,
    rr: 19,
    status: 'Aktif',
    signalQuality: 92,
  },
  {
    id: 'nenek',
    name: 'Hj. Aminah',
    role: 'Nenek',
    initials: 'HA',
    age: 68,
    avatarBg: 'bg-amber-800',
    hr: 68,
    hrv: 38,
    rr: 15,
    status: 'Perlu Perhatian',
    signalQuality: 94,
  },
]

export const Dashboard: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<FamilyMember>(familyMembers[0])

  const [activeNav, setActiveNav] = useState<string>('dashboard')
  const [timeRange, setTimeRange] = useState<'harian' | 'mingguan' | 'bulanan'>('harian')
  const [showActivityOverlay, setShowActivityOverlay] = useState<boolean>(true)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)

  // Quick Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false)
  const [selectedLogCategory, setSelectedLogCategory] = useState<ActivityItem['category'] | null>(null)
  const [logDetail, setLogDetail] = useState<string>('')

  // rPPG Measurement Modal State
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState<boolean>(false)

  // Global Chat Context
  const { addAiMessage } = useChat()

  const handleSelectMember = (member: FamilyMember) => {
    setSelectedMember(member)
    addAiMessage(
      `Menampilkan profil kesehatan ${member.name} (${member.role}). Detak jantung ${member.hr} BPM & HRV ${member.hrv} ms (${member.status.toLowerCase()}).`
    )
  }

  // Activity list
  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      category: 'olahraga',
      title: 'Jalan Santai',
      detail: '30 menit di taman komplek',
      time: '06:30 WIB',
      timestamp: 6.5,
    },
    {
      id: '2',
      category: 'kopi',
      title: 'Kopi Hitam',
      detail: '1 cangkir arabika (panas)',
      time: '09:15 WIB',
      timestamp: 9.25,
    },
    {
      id: '3',
      category: 'makan',
      title: 'Makan Siang',
      detail: 'Nasi, dada ayam, tumis brokoli',
      time: '12:30 WIB',
      timestamp: 12.5,
    },
  ])

  // Mock data points for charts
  const hourlyData = [
    { time: '06:00', hr: 64, hrv: 58, rr: 14, label: '06:00' },
    { time: '07:00', hr: 78, hrv: 46, rr: 18, label: '07:00' }, // after walk
    { time: '08:00', hr: 69, hrv: 54, rr: 15, label: '08:00' },
    { time: '09:00', hr: 72, hrv: 52, rr: 16, label: '09:00' },
    { time: '10:00', hr: 84, hrv: 42, rr: 17, label: '10:00' }, // after coffee (mild anomaly spike)
    { time: '11:00', hr: 76, hrv: 48, rr: 16, label: '11:00' },
    { time: '12:00', hr: 73, hrv: 51, rr: 15, label: '12:00' },
    { time: '13:00', hr: 75, hrv: 49, rr: 16, label: '13:00' },
    { time: '14:00', hr: 71, hrv: 53, rr: 15, label: '14:00' },
  ]

  const weeklyData = [
    { time: 'Senin', hr: 70, hrv: 52, rr: 15, label: 'Sen' },
    { time: 'Selasa', hr: 73, hrv: 50, rr: 16, label: 'Sel' },
    { time: 'Rabu', hr: 71, hrv: 54, rr: 15, label: 'Rab' },
    { time: 'Kamis', hr: 75, hrv: 48, rr: 16, label: 'Kam' },
    { time: 'Jumat', hr: 72, hrv: 53, rr: 15, label: 'Jum' },
    { time: 'Sabtu', hr: 68, hrv: 57, rr: 14, label: 'Sab' },
    { time: 'Minggu', hr: 71, hrv: 55, rr: 15, label: 'Min' },
  ]

  const monthlyData = [
    { time: 'Mgg 1', hr: 71, hrv: 53, rr: 15, label: 'Mgg 1' },
    { time: 'Mgg 2', hr: 73, hrv: 51, rr: 16, label: 'Mgg 2' },
    { time: 'Mgg 3', hr: 70, hrv: 54, rr: 15, label: 'Mgg 3' },
    { time: 'Mgg 4', hr: 72, hrv: 52, rr: 15, label: 'Mgg 4' },
  ]

  const currentChartData =
    timeRange === 'harian' ? hourlyData : timeRange === 'mingguan' ? weeklyData : monthlyData

  // SVG Chart Geometry
  const svgWidth = 960
  const svgHeight = 220
  const padLeft = 40
  const padRight = 30
  const padTop = 24
  const padBottom = 34
  const plotWidth = svgWidth - padLeft - padRight
  const plotHeight = svgHeight - padTop - padBottom

  const minHR = 50
  const maxHR = 100

  const getY = (val: number) => {
    const clamped = Math.max(minHR, Math.min(maxHR, val))
    return padTop + plotHeight - ((clamped - minHR) / (maxHR - minHR)) * plotHeight
  }

  const getX = (idx: number) => {
    return padLeft + (idx / (currentChartData.length - 1)) * plotWidth
  }

  const hrPoints = currentChartData.map((d, i) => `${getX(i)},${getY(d.hr)}`).join(' ')
  const areaPoints = `${getX(0)},${padTop + plotHeight} ${hrPoints} ${getX(currentChartData.length - 1)},${padTop + plotHeight}`

  const categories = [
    { key: 'kopi', label: 'Kopi', icon: '☕' },
    { key: 'olahraga', label: 'Olahraga', icon: '🏃' },
    { key: 'tidur', label: 'Tidur', icon: '🌙' },
    { key: 'makan', label: 'Makan', icon: '🍲' },
    { key: 'rokok', label: 'Rokok', icon: '🚬' },
    { key: 'alkohol', label: 'Alkohol', icon: '🍷' },
  ] as const

  const handleAddActivity = () => {
    if (!selectedLogCategory) return
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`

    const newAct: ActivityItem = {
      id: Date.now().toString(),
      category: selectedLogCategory,
      title: categories.find((c) => c.key === selectedLogCategory)?.label || 'Aktivitas',
      detail: logDetail.trim() || 'Dicatat via Quick Logger',
      time: timeStr,
      timestamp: now.getHours() + now.getMinutes() / 60,
    }
    setActivities([newAct, ...activities])
    setIsLogModalOpen(false)
    setSelectedLogCategory(null)
    setLogDetail('')
  }

  return (
    <div className="min-h-screen bg-[#F0EEE6] text-slate-900 flex flex-col items-center justify-start p-2 sm:p-4 lg:p-5 font-sans antialiased">
      {/* MAIN CONTAINER - Widescreen Expansion */}
      <div className="w-full max-w-[98vw] 2xl:max-w-[1920px] mx-auto bg-white/95 backdrop-blur-md rounded-[2rem] sm:rounded-[2.5rem] border border-stone-200/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] p-4 sm:p-7 md:p-8 space-y-7">
        {/* 1. TOP NAVIGATION BAR (Exact reference aesthetic) */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-stone-100">
          {/* Brand Logo with cross/heart symbol */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="w-10 h-10 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-xs">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight block leading-tight">
                Nadiku
              </span>
              <span className="text-xs text-teal-800 font-semibold tracking-wide uppercase">
                Family Health Monitor
              </span>
            </div>
          </div>

          {/* Navigation Pill Group (Active = solid pill, inactive = soft text) */}
          <nav className="flex items-center gap-1 bg-stone-100/80 p-1.5 rounded-full border border-stone-200/60 overflow-x-auto max-w-full">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'rppg', label: 'Pengukuran rPPG' },
              { id: 'riwayat', label: 'Riwayat & Tren' },
              { id: 'aktivitas', label: 'Aktivitas' },
              { id: 'keluarga', label: 'Keluarga' },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeNav === tab.id ? 'primary' : 'ghost'}
                onPress={() => setActiveNav(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  activeNav === tab.id
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </nav>

          {/* Family Member Profile Selector using HeroUI Dropdown */}
          <div className="flex items-center self-end md:self-auto">
            <Dropdown>
              <Dropdown.Trigger
                aria-label="Pilih profil anggota keluarga"
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-stone-100/70 transition cursor-pointer outline-hidden group"
              >
                <Avatar size="sm" className={`${selectedMember.avatarBg} text-white font-bold text-xs shadow-xs`}>
                  <Avatar.Fallback>{selectedMember.initials}</Avatar.Fallback>
                </Avatar>
                <div className="text-left hidden sm:flex flex-col">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-800 leading-tight whitespace-nowrap">
                      {selectedMember.name}
                    </span>
                    <span className="text-xs font-semibold text-teal-700 leading-none whitespace-nowrap">
                      ({selectedMember.role})
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium leading-tight whitespace-nowrap">
                    {selectedMember.age} thn · {selectedMember.status}
                  </span>
                </div>
                <svg
                  className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-0.5 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </Dropdown.Trigger>

              <Dropdown.Popover
                placement="bottom end"
                className="w-80 p-2 bg-white border border-stone-200/90 rounded-2xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-2.5 py-2 mb-1 border-b border-stone-100">
                  <p className="text-xs font-bold text-slate-800">Profil Keluarga</p>
                  <p className="text-xs text-slate-400">Ganti pemantauan data vital</p>
                </div>

                <Dropdown.Menu
                  aria-label="Daftar Anggota Keluarga"
                  onAction={(key) => {
                    const found = familyMembers.find((m) => m.id === String(key))
                    if (found) {
                      handleSelectMember(found)
                    }
                  }}
                  className="space-y-1 outline-hidden"
                >
                  {familyMembers.map((member) => (
                    <Dropdown.Item
                      key={member.id}
                      id={member.id}
                      textValue={`${member.name} (${member.role})`}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition outline-hidden ${
                        selectedMember.id === member.id
                          ? 'bg-teal-50 text-teal-950 font-semibold'
                          : 'hover:bg-stone-100/80 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar size="sm" className={`${member.avatarBg} text-white font-bold text-xs shadow-xs shrink-0`}>
                          <Avatar.Fallback>{member.initials}</Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col text-left">
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-xs font-bold text-slate-900 whitespace-nowrap">
                              {member.name}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-stone-100 text-slate-600 font-medium whitespace-nowrap shrink-0">
                              {member.role}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {member.age} thn
                          </span>
                        </div>
                      </div>

                      {selectedMember.id === member.id && (
                        <svg
                          className="w-4 h-4 text-teal-600 shrink-0 ml-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>
        </header>

        {/* 2. MAIN DASHBOARD CONTENT (FULL WIDTH) */}
        <main className="space-y-6 w-full">
            {/* Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold tracking-wide">
                  Halo, {selectedMember.name} 👋
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Pantau Kesehatan {selectedMember.role === 'Kepala Keluarga' ? 'Keluarga' : selectedMember.name} Hari Ini
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Chip size="sm" color="success" variant="soft" className="font-semibold text-xs">
                  Sinyal rPPG {selectedMember.signalQuality}%
                </Chip>
                <Button
                  size="sm"
                  variant="primary"
                  onPress={() => setIsMeasureModalOpen(true)}
                  className="bg-slate-900 text-white rounded-full font-bold px-4 shadow-xs cursor-pointer"
                >
                  Ukur Sekarang
                </Button>
              </div>
            </div>

            {/* HERO BANNER CARD WITH ILLUSTRATION (OPTION A) */}
            <Card className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-50/70 via-white to-stone-50/50 border border-teal-100/90 p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-3 z-10 max-w-xl text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100/70 border border-teal-200/80 text-teal-900 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse inline-block" />
                    Sensor Optik Kamera (rPPG)
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    Pantau Vital Sign Mandiri & Non-Invasif
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Ukur detak jantung, variabilitas (HRV), dan laju pernapasan secara otomatis hanya melalui pantulan cahaya mikrosirkulasi wajah di webcam — tanpa alat tambahan.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                      size="sm"
                      variant="primary"
                      onPress={() => setIsMeasureModalOpen(true)}
                      className="bg-slate-900 text-white rounded-full font-bold px-5 py-2 shadow-xs hover:bg-slate-800 transition flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-teal-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Mulai Pengukuran rPPG
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => {
                        addAiMessage(
                          'Teknologi rPPG (remote photoplethysmography) bekerja dengan mendeteksi perubahan mikroskopis warna kulit akibat aliran darah per denyut jantung menggunakan webcam standar Anda. Cukup duduk tenang dengan pencahayaan cukup!',
                          true
                        )
                      }}
                      className="text-slate-600 hover:text-slate-900 rounded-full font-semibold text-xs px-4 cursor-pointer"
                    >
                      Pelajari Cara Kerja ↗
                    </Button>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center p-1">
                  <img
                    src={vitalMonitoringIllustration}
                    alt="Ilustrasi Pemantauan Data Vital"
                    className="w-44 sm:w-52 md:w-60 h-auto max-h-44 object-contain drop-shadow-xs"
                  />
                </div>
              </div>
            </Card>

            {/* ROW 1: 3 VITAL METRIC SUMMARY CARDS (Like Consultations, Satisfaction, Revenue in ref) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Metric 1: Heart Rate */}
              <Card className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Detak Jantung</span>
                  <span className="text-xs text-stone-400 font-mono">↗</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedMember.hr}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">BPM</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <span className="text-slate-500 font-medium">Status</span>
                  <Chip size="sm" color={selectedMember.status === 'Perlu Perhatian' ? 'warning' : 'success'} variant="soft" className="font-bold text-xs">
                    {selectedMember.status}
                  </Chip>
                </div>
              </Card>

              {/* Metric 2: HRV RMSSD */}
              <Card className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Variabilitas (HRV)</span>
                  <span className="text-xs text-stone-400 font-mono">↗</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedMember.hrv}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">ms RMSSD</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <span className="text-slate-500 font-medium">Saraf Otonom</span>
                  <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                    {selectedMember.hrv >= 50 ? 'Optimal' : selectedMember.hrv >= 40 ? 'Sedang' : 'Waspada'}
                  </Chip>
                </div>
              </Card>

              {/* Metric 3: Respiration Rate */}
              <Card className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Laju Pernapasan</span>
                  <span className="text-xs text-stone-400 font-mono">↗</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{selectedMember.rr}</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">bpm</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <span className="text-slate-500 font-medium">Rentang 12-20</span>
                  <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                    Rileks
                  </Chip>
                </div>
              </Card>
            </div>

            {/* ROW 2: PROMINENT TIME-SERIES TREND CARD (Like Current Patients section in ref) */}
            <Card className="p-5 sm:p-6 rounded-3xl bg-white border border-stone-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Tren Dinamika Vital Sign & Baseline
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Korelasi fluktuasi denyut nadi dengan kebiasaan gaya hidup Anda.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Switch isSelected={showActivityOverlay} onChange={setShowActivityOverlay}>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                    <Switch.Content className="text-xs font-semibold text-slate-700">
                      Penanda Aktivitas
                    </Switch.Content>
                  </Switch>

                  <ButtonGroup variant="secondary" className="bg-stone-100 p-1 rounded-full text-xs">
                    <Button
                      size="sm"
                      variant={timeRange === 'harian' ? 'primary' : 'ghost'}
                      onPress={() => setTimeRange('harian')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        timeRange === 'harian'
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      Harian
                    </Button>
                    <Button
                      size="sm"
                      variant={timeRange === 'mingguan' ? 'primary' : 'ghost'}
                      onPress={() => setTimeRange('mingguan')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        timeRange === 'mingguan'
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      Mingguan
                    </Button>
                  </ButtonGroup>
                </div>
              </div>

              {/* Chart SVG Canvas */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full min-w-[580px] h-[220px] overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0E7490" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#0E7490" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[50, 65, 80, 95].map((hrVal) => {
                    const y = getY(hrVal)
                    return (
                      <g key={hrVal}>
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={svgWidth - padRight}
                          y2={y}
                          stroke="#F1F0EA"
                          strokeWidth="1"
                        />
                        <text
                          x={padLeft - 8}
                          y={y + 4}
                          textAnchor="end"
                          className="text-xs font-mono fill-stone-400 font-semibold"
                        >
                          {hrVal}
                        </text>
                      </g>
                    )
                  })}

                  {/* Baseline 69 BPM */}
                  <line
                    x1={padLeft}
                    y1={getY(69)}
                    x2={svgWidth - padRight}
                    y2={getY(69)}
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={svgWidth - padRight - 5}
                    y={getY(69) - 6}
                    textAnchor="end"
                    className="text-xs fill-emerald-800 font-bold"
                  >
                    Baseline: 69 BPM
                  </text>

                  {/* Area fill */}
                  <polygon points={areaPoints} fill="url(#tealGrad)" />

                  {/* Polyline curve */}
                  <polyline
                    points={hrPoints}
                    fill="none"
                    stroke="#0E7490"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points */}
                  {currentChartData.map((d, idx) => {
                    const cx = getX(idx)
                    const cy = getY(d.hr)
                    const isHovered = hoveredPointIndex === idx
                    return (
                      <g
                        key={idx}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                        onMouseLeave={() => setHoveredPointIndex(null)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 6 : 4}
                          className={`transition-all duration-150 ${
                            isHovered
                              ? 'fill-teal-900 stroke-white stroke-2'
                              : 'fill-white stroke-teal-700 stroke-2'
                          }`}
                        />
                        <text
                          x={cx}
                          y={padTop + plotHeight + 18}
                          textAnchor="middle"
                          className="text-xs fill-slate-500 font-medium"
                        >
                          {d.label}
                        </text>
                        {isHovered && (
                          <g>
                            <rect
                              x={cx - 40}
                              y={cy - 44}
                              width="80"
                              height="32"
                              rx="8"
                              className="fill-slate-900 shadow-md"
                            />
                            <text
                              x={cx}
                              y={cy - 24}
                              textAnchor="middle"
                              className="text-xs fill-white font-bold"
                            >
                              {d.hr} BPM
                            </text>
                          </g>
                        )}
                      </g>
                    )
                  })}

                  {/* Activity Markers */}
                  {showActivityOverlay &&
                    timeRange === 'harian' &&
                    activities.map((act) => {
                      const dataIndex = hourlyData.findIndex(
                        (d) => Number(d.time.split(':')[0]) === Math.floor(act.timestamp)
                      )
                      if (dataIndex === -1) return null
                      const actX = getX(dataIndex)
                      const actY = getY(hourlyData[dataIndex].hr) - 22

                      return (
                        <g key={act.id} className="cursor-pointer">
                          <line
                            x1={actX}
                            y1={actY + 10}
                            x2={actX}
                            y2={getY(hourlyData[dataIndex].hr)}
                            stroke="#0E7490"
                            strokeWidth="1.2"
                            strokeDasharray="2 2"
                          />
                          <circle
                            cx={actX}
                            cy={actY}
                            r="11"
                            className="fill-white stroke-stone-300 stroke-1.5 shadow-xs"
                          />
                          <text
                            x={actX}
                            y={actY + 4}
                            textAnchor="middle"
                            className="text-xs select-none pointer-events-none"
                          >
                            {act.category === 'kopi'
                              ? '☕'
                              : act.category === 'olahraga'
                                ? '🏃'
                                : '🍲'}
                          </text>
                        </g>
                      )
                    })}
                </svg>
              </div>

              {/* Quick Logger Strip */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-700">Catat Cepat:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categories.map((cat) => (
                    <Button
                      key={cat.key}
                      size="sm"
                      variant="outline"
                      onPress={() => {
                        setSelectedLogCategory(cat.key)
                        setIsLogModalOpen(true)
                      }}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border-stone-200 hover:border-teal-700 hover:bg-teal-50/40"
                    >
                      <span className="mr-1">{cat.icon}</span>
                      {cat.label}
                    </Button>
                  ))}
                </div>
              </div>
            </Card>

            {/* ROW 3: THREE ANALYTICAL CARDS (Exact match to Visits, Workload, Reviews in reference!) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Activity Breakdown (Donut Ring Chart like "Visits") */}
              <Card className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700">Porsi Aktivitas</h3>
                  <span className="text-xs text-stone-400 font-mono">↗</span>
                </div>

                <div className="flex items-center justify-center py-1">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                      {/* Ring 1 (Istirahat 45%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#0D9488"
                        strokeWidth="4"
                        strokeDasharray="45 55"
                        strokeDashoffset="0"
                      />
                      {/* Ring 2 (Olahraga 35%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#0284C7"
                        strokeWidth="4"
                        strokeDasharray="35 65"
                        strokeDashoffset="-45"
                      />
                      {/* Ring 3 (Konsumsi 20%) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="4"
                        strokeDasharray="20 80"
                        strokeDashoffset="-80"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xs font-extrabold text-slate-900">100%</span>
                      <span className="text-xs text-slate-500">Tercatat</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" /> Istirahat
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" /> Olahraga
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Kafein
                  </span>
                </div>
              </Card>

              {/* Card 2: Weekly Workload / Trend (Bar Chart like "Workload") */}
              <Card className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700">Denyut Mingguan</h3>
                  <span className="text-xs text-stone-400 font-mono">↗</span>
                </div>

                {/* Vertical Bars for 7 days */}
                <div className="h-28 flex items-end justify-between gap-1.5 pt-4 px-1">
                  {[
                    { day: 'Sen', val: 70, height: '60%' },
                    { day: 'Sel', val: 73, height: '70%' },
                    { day: 'Rab', val: 71, height: '65%' },
                    { day: 'Kam', val: 78, height: '90%', highlight: true },
                    { day: 'Jum', val: 72, height: '68%' },
                    { day: 'Sab', val: 68, height: '55%' },
                    { day: 'Min', val: 71, height: '65%' },
                  ].map((item) => (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full bg-stone-100 rounded-t-lg h-20 flex items-end justify-center p-0.5">
                        <div
                          style={{ height: item.height }}
                          className={`w-full rounded-t-md transition-all ${
                            item.highlight ? 'bg-teal-800' : 'bg-teal-500/70'
                          }`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{item.day}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center text-xs text-slate-500 pt-1">
                  Rata-rata: <strong className="text-slate-800">71.8 BPM</strong>
                </div>
              </Card>

              {/* Card 3: Health Score Gauge (Semicircle Speedometer like "Your reviews") */}
              <Card className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700">Skor Pemulihan</h3>
                  <span className="text-xs text-stone-400 font-mono">↗</span>
                </div>

                <div className="flex flex-col items-center justify-center py-1">
                  <div className="relative w-28 h-16 overflow-hidden flex items-end justify-center">
                    <svg viewBox="0 0 100 55" className="w-28 h-16">
                      {/* Background arc */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#E7E5E4"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {/* Active score arc (85%) */}
                      <path
                        d="M 10 50 A 40 40 0 0 1 78 22"
                        fill="none"
                        stroke="#0D9488"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute bottom-0 text-center">
                      <span className="text-xl font-extrabold text-slate-900 block leading-none">
                        85%
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-teal-800 mt-1">Kondisi Prima</span>
                </div>

                <div className="text-center text-xs text-slate-500 pt-1 border-t border-stone-100">
                  Zona Pemulihan Otonom Baik
                </div>
              </Card>
            </div>
        </main>

        {/* 3. PERSISTENT DISCLAIMER FOOTER */}
        <footer className="pt-4 border-t border-stone-100 text-center text-xs text-slate-500 space-y-1">
          <p className="text-slate-600 font-medium">
            <strong>Pernyataan Non-Medis:</strong> Nadiku adalah platform pemantauan kebugaran dan
            wellness berbasis rPPG & ML Anomaly Detection. Hasil pengukuran bersifat informasional dan
            tidak menggantikan diagnosis, pemeriksaan medis klinis, atau konsultasi dokter.
          </p>
          <p className="text-slate-400">
            Nadiku &copy; 2026 &middot; Didesain dengan prinsip ketenangan dan kepedulian keluarga.
          </p>
        </footer>
      </div>

      {/* QUICK LOG MODAL */}
      <Modal isOpen={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <Modal.Backdrop className="bg-slate-900/50 backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center p-4">
          <Modal.Container className="w-full max-w-md">
            <Modal.Dialog className="bg-white rounded-3xl p-6 sm:p-8 w-full border border-stone-200 shadow-xl space-y-5">
              <Modal.CloseTrigger />
              <Modal.Header className="flex items-center gap-2 pb-3 border-b border-stone-100">
                <span className="text-2xl">
                  {categories.find((c) => c.key === selectedLogCategory)?.icon}
                </span>
                <div>
                  <Modal.Heading className="text-base font-bold text-slate-900 tracking-tight">
                    Catat {categories.find((c) => c.key === selectedLogCategory)?.label}
                  </Modal.Heading>
                  <p className="text-xs text-slate-500">Tambahkan detail catatan waktu & aktivitas</p>
                </div>
              </Modal.Header>

              <Modal.Body className="space-y-4">
                <TextField className="w-full">
                  <Label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Catatan / Keterangan
                  </Label>
                  <Input
                    placeholder="misal: 1 cangkir espresso / jalan pagi 30 menit"
                    value={logDetail}
                    onChange={(e) => setLogDetail(e.target.value)}
                    className="w-full"
                  />
                </TextField>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>
                    Waktu Catat: Sekarang ({new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB)
                  </span>
                </div>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setIsLogModalOpen(false)}
                  className="px-5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-stone-100"
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={handleAddActivity}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                >
                  Simpan Aktivitas
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* SIMULATED rPPG MEASUREMENT MODAL */}
      <Modal isOpen={isMeasureModalOpen} onOpenChange={setIsMeasureModalOpen}>
        <Modal.Backdrop className="bg-slate-900/60 backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center p-4">
          <Modal.Container className="w-full max-w-lg">
            <Modal.Dialog className="bg-white rounded-3xl p-6 sm:p-8 w-full border border-stone-200 shadow-2xl space-y-5">
              <Modal.CloseTrigger />
              <Modal.Header className="space-y-1 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  <Modal.Heading className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Pengukuran Vital Sign Kamera (rPPG)
                  </Modal.Heading>
                </div>
                <p className="text-xs text-slate-500">
                  Pastikan wajah berada di dalam bingkai dan pencahayaan ruangan memadai.
                </p>
              </Modal.Header>

              <Modal.Body className="space-y-4">
                {/* Simulated Webcam Viewfinder */}
                <div className="relative w-full h-56 bg-slate-950 rounded-2xl overflow-hidden flex flex-col items-center justify-center border border-slate-800">
                  {/* Facial Oval Frame */}
                  <div className="w-32 h-44 border-2 border-dashed border-teal-400/70 rounded-[50%] flex items-center justify-center relative animate-pulse">
                    <span className="text-[10px] font-mono text-teal-300 bg-slate-900/80 px-2 py-0.5 rounded-full">
                      Posisikan Wajah
                    </span>
                  </div>

                  {/* Top-right Status Pill */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] text-emerald-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Kualitas: {selectedMember.signalQuality}%
                  </div>

                  {/* Bottom live stats */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs text-white">
                    <span className="text-slate-300">Detak Estimasi:</span>
                    <span className="font-mono font-bold text-teal-300">{selectedMember.hr} BPM</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>Memproses Sinyal Mikrovaskular Wajah...</span>
                    <span className="text-teal-700 font-mono font-bold">100%</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-teal-700 h-2 rounded-full w-full transition-all duration-500" />
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setIsMeasureModalOpen(false)}
                  className="px-5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-stone-100 cursor-pointer"
                >
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onPress={() => {
                    setIsMeasureModalOpen(false)
                    addAiMessage(
                      `Pengukuran rPPG selesai untuk ${selectedMember.name}. Hasil: ${selectedMember.hr} BPM, HRV ${selectedMember.hrv} ms (${selectedMember.status}). Kondisi Anda terpantau stabil! 👍`,
                      true
                    )
                  }}
                  className="px-6 py-2 rounded-full text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white shadow-xs cursor-pointer"
                >
                  Simpan & Perbarui Data
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  )
}

export default Dashboard
