import React, { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button, ButtonGroup } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextField } from '@/components/ui/field'
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
  Search,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  ArrowUpRight,
  Check,
} from 'lucide-react'
import vitalMonitoringIllustration from '../assets/illustrations/vital-monitoring.svg'
import { useChat } from '../context/ChatContext'
import FamilyMonitoring from './FamilyMonitoring'

interface ActivityItem {
  id: string
  category: 'kopi' | 'olahraga' | 'tidur' | 'rokok' | 'makan' | 'alkohol'
  title: string
  detail: string
  time: string
  timestamp: number // for chart positioning
}

export interface UserProfile {
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

const currentUser: UserProfile = {
  id: 'budi',
  name: 'Budi Pratama',
  role: 'Kepala Keluarga',
  initials: 'BP',
  age: 42,
  avatarBg: 'bg-indigo-700',
  hr: 72,
  hrv: 52,
  rr: 16,
  status: 'Normal',
  signalQuality: 98,
}

export const Dashboard: React.FC = () => {
  const { addAiMessage } = useChat()
  const [activeNav, setActiveNav] = useState<string>('dashboard')
  const [timeRange, setTimeRange] = useState<'harian' | 'mingguan' | 'bulanan'>('harian')
  const [isTimeDropdownOpen, setIsTimeDropdownOpen] = useState(false)
  const [showActivityOverlay, setShowActivityOverlay] = useState(true)
  const [showHrvComparison, setShowHrvComparison] = useState(true)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [selectedLogCategory, setSelectedLogCategory] = useState<
    'kopi' | 'olahraga' | 'tidur' | 'rokok' | 'makan' | 'alkohol' | null
  >(null)
  const [logDetail, setLogDetail] = useState('')
  const [isMeasureModalOpen, setIsMeasureModalOpen] = useState(false)
  const [targetMeasureMember, setTargetMeasureMember] = useState<{
    name: string
    hr: number
    hrv: number
    status: string
    signalQuality: number
  } | null>(null)

  const [activities, setActivities] = useState<ActivityItem[]>([
    {
      id: '1',
      category: 'olahraga',
      title: 'Peregangan Yoga',
      detail: 'Siti Rahma · Pasca sesi 25 menit peregangan',
      time: '06:15 WIB',
      timestamp: 6.25,
    },
    {
      id: '2',
      category: 'kopi',
      title: '1 Cangkir Espresso',
      detail: 'Budi Pratama · Kopi hitam tanpa gula sebelum kerja',
      time: '08:30 WIB',
      timestamp: 8.5,
    },
    {
      id: '3',
      category: 'olahraga',
      title: 'Aktivitas Bersepeda',
      detail: 'Dimas Pratama · Bersepeda keliling komplek',
      time: '10:00 WIB',
      timestamp: 10.0,
    },
  ])

  // Mock multi-scale datasets
  const hourlyData = [
    { time: '06:00', hr: 68, hrv: 55, rr: 14, label: '06:00' },
    { time: '07:00', hr: 70, hrv: 53, rr: 15, label: '07:00' },
    { time: '08:00', hr: 74, hrv: 48, rr: 16, label: '08:00' },
    { time: '09:00', hr: 78, hrv: 45, rr: 17, label: '09:00' },
    { time: '10:00', hr: 76, hrv: 47, rr: 16, label: '10:00' },
    { time: '11:00', hr: 72, hrv: 52, rr: 15, label: '11:00' },
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
    addAiMessage(
      `Aktivitas "${newAct.title}" (${newAct.detail}) berhasil dicatat dan dipetakan ke grafik tren vital harian Anda.`,
      true
    )
  }

  const measuredPerson = targetMeasureMember || currentUser

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-slate-900 flex flex-col items-center justify-start p-3 sm:p-5 lg:p-7 font-sans antialiased">
      {/* MAIN CONTAINER */}
      <div className="w-full max-w-[98vw] 2xl:max-w-[1920px] mx-auto space-y-6">
        {/* 1. TOP APP BAR / BRAND HEADER */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl px-5 py-3.5 shadow-xs">
          {/* Brand Logo with heart symbol */}
          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Heart className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tight block leading-tight">
                Nadiku
              </span>
              <span className="text-xs text-indigo-600 font-semibold tracking-wide uppercase">
                Family Health Monitor
              </span>
            </div>
          </div>

          {/* Navigation Pill Group */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/60 overflow-x-auto max-w-full">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'rppg', label: 'Ukur rPPG' },
              { id: 'riwayat', label: 'Riwayat & Tren' },
              { id: 'aktivitas', label: 'Aktivitas' },
              { id: 'keluarga', label: 'Keluarga' },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="sm"
                variant={activeNav === tab.id ? 'default' : 'ghost'}
                onClick={() => {
                  if (tab.id === 'rppg') {
                    setTargetMeasureMember(null)
                    setIsMeasureModalOpen(true)
                  } else if (tab.id === 'aktivitas') {
                    setActiveNav('dashboard')
                    setIsLogModalOpen(true)
                  } else {
                    setActiveNav(tab.id)
                  }
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
                  activeNav === tab.id
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </nav>

          {/* Right Action Icons & User Account Avatar (matching reference header) */}
          <div className="flex items-center gap-2.5 self-end md:self-auto">
            <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-slate-200/60">
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                aria-label="Cari"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                aria-label="Mode Gelap"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                aria-label="Mode Terang"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-white transition cursor-pointer"
                aria-label="Notifikasi"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
              </button>
            </div>

            {/* Current User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 select-none">
              <Avatar size="sm" className={`${currentUser.avatarBg} text-white font-bold text-xs shadow-xs`}>
                <AvatarFallback className="bg-indigo-700 text-white font-bold">
                  {currentUser.initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-slate-500 leading-none">
                  {currentUser.role}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* 2. MAIN DASHBOARD CONTENT */}
        <main className="space-y-6 w-full">
          {activeNav === 'keluarga' ? (
            <FamilyMonitoring
              onMeasureMember={(member) => {
                setTargetMeasureMember({
                  name: `${member.name} (${member.relation})`,
                  hr: member.hr,
                  hrv: member.hrv,
                  status: member.status,
                  signalQuality: member.signalQuality,
                })
                setIsMeasureModalOpen(true)
              }}
              onBackToDashboard={() => setActiveNav('dashboard')}
            />
          ) : (
            <>
              {/* SECTION: TITLE & KEY METRICS HEADER */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      Dashboard
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      Pantau indikator kesehatan vital, ritme kardiovaskular, dan aktivitas harian Anda.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Chip size="sm" color="success" variant="soft" className="font-semibold text-xs">
                      Sinyal rPPG {currentUser.signalQuality}%
                    </Chip>
                    <Button
                      size="sm"
                      onClick={() => setIsMeasureModalOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold px-4 py-2 shadow-xs cursor-pointer flex items-center gap-1.5 text-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      Ukur Sekarang
                    </Button>
                  </div>
                </div>

                {/* Sub-header: "Key Metrics" with Dark Pill Selector */}
                <div className="flex items-center justify-between pt-1">
                  <h2 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">
                    Key Metrics
                  </h2>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                      className="bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-full px-4 py-1.5 text-xs font-semibold flex items-center gap-2 shadow-xs transition cursor-pointer"
                    >
                      <span>
                        {timeRange === 'bulanan' ? 'Monthly' : timeRange === 'mingguan' ? 'Weekly' : 'Daily'}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
                    </button>

                    {isTimeDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                        <button
                          type="button"
                          onClick={() => {
                            setTimeRange('bulanan')
                            setIsTimeDropdownOpen(false)
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between cursor-pointer"
                        >
                          Monthly {timeRange === 'bulanan' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTimeRange('mingguan')
                            setIsTimeDropdownOpen(false)
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between cursor-pointer"
                        >
                          Weekly {timeRange === 'mingguan' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTimeRange('harian')
                            setIsTimeDropdownOpen(false)
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 font-medium flex items-center justify-between cursor-pointer"
                        >
                          Daily {timeRange === 'harian' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ROW: 4 DEFINED KEY METRIC CARDS (FOLLOWING REFERENCE IMAGE STYLE) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Detak Jantung (Indigo Squircle) */}
                  <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0">
                        <Heart className="w-5 h-5 fill-indigo-100" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold text-slate-500 block">
                          Detak Jantung
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                            {currentUser.hr}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 uppercase">BPM</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        ↗ 8.2% <span className="text-slate-400 font-normal">Vs 30 Hari</span>
                      </span>
                      <Chip size="sm" color={currentUser.status === 'Perlu Perhatian' ? 'warning' : 'success'} variant="soft" className="font-bold text-[10px]">
                        {currentUser.status}
                      </Chip>
                    </div>
                  </Card>

                  {/* Card 2: Variabilitas HRV (Emerald Squircle) */}
                  <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100/80 flex items-center justify-center text-emerald-600 shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold text-slate-500 block">
                          Variabilitas (HRV)
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                            {currentUser.hrv}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 uppercase">ms RMSSD</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        ↗ 18% <span className="text-slate-400 font-normal">Vs 30 Hari</span>
                      </span>
                      <Chip size="sm" color="success" variant="soft" className="font-bold text-[10px]">
                        {currentUser.hrv >= 50 ? 'Optimal' : currentUser.hrv >= 40 ? 'Sedang' : 'Waspada'}
                      </Chip>
                    </div>
                  </Card>

                  {/* Card 3: Laju Pernapasan (Amber Squircle) */}
                  <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100/80 flex items-center justify-center text-amber-600 shrink-0">
                        <Wind className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold text-slate-500 block">
                          Laju Pernapasan
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                            {currentUser.rr}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 uppercase">bpm</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        ↗ 8% <span className="text-slate-400 font-normal">Vs 30 Hari</span>
                      </span>
                      <Chip size="sm" color="success" variant="soft" className="font-bold text-[10px]">
                        Rileks (12-20)
                      </Chip>
                    </div>
                  </Card>

                  {/* Card 4: Kualitas Sinyal rPPG (Rose Squircle) */}
                  <Card className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-600 shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold text-slate-500 block">
                          Kualitas Sinyal rPPG
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                            {currentUser.signalQuality}%
                          </span>
                          <span className="text-xs font-semibold text-slate-400 uppercase">Kamera</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                        ↗ Stabil <span className="text-slate-400 font-normal">15 fps</span>
                      </span>
                      <Chip size="sm" color="success" variant="soft" className="font-bold text-[10px]">
                        Sangat Baik
                      </Chip>
                    </div>
                  </Card>
                </div>
              </div>

              {/* HERO BANNER CARD WITH ILLUSTRATION */}
              <Card className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-indigo-50/70 via-white to-teal-50/50 border border-slate-200/80 p-5 sm:p-6 shadow-xs w-full">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2.5 z-10 max-w-xl text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-indigo-100/80 border border-indigo-200/80 text-indigo-900 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse inline-block" />
                      Sensor Optik Kamera (rPPG)
                    </div>

                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                      Pantau Vital Sign Mandiri & Non-Invasif
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      Ukur detak jantung, variabilitas (HRV), dan laju pernapasan secara otomatis hanya melalui pantulan cahaya mikrosirkulasi wajah di webcam — tanpa alat tambahan.
                    </p>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <Button
                        size="sm"
                        onClick={() => setIsMeasureModalOpen(true)}
                        className="bg-slate-900 text-white rounded-full font-bold px-5 py-2 shadow-xs hover:bg-slate-800 transition flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5 text-indigo-300" />
                        Mulai Pengukuran rPPG
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          addAiMessage(
                            'Teknologi rPPG (remote photoplethysmography) bekerja dengan mendeteksi perubahan mikroskopis warna kulit akibat aliran darah per denyut jantung menggunakan webcam standar Anda. Cukup duduk tenang dengan pencahayaan cukup!',
                            true
                          )
                        }}
                        className="text-slate-700 hover:text-slate-900 rounded-full font-semibold text-xs px-4 cursor-pointer border-slate-200"
                      >
                        Pelajari Cara Kerja
                        <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-slate-400" />
                      </Button>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-center p-1">
                    <img
                      src={vitalMonitoringIllustration}
                      alt="Ilustrasi Pemantauan Data Vital"
                      className="w-44 sm:w-52 md:w-60 h-auto max-h-44 object-contain"
                    />
                  </div>
                </div>
              </Card>

              {/* 2-COLUMN SECTION: STARTS LEVEL WITH DETAK JANTUNG */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                {/* LEFT COLUMN: 8 COLS (PROMINENT BIOMETRIC TIME-SERIES TREND CARD) */}
                <div className="lg:col-span-8 space-y-6">
                  <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          Tren Dinamika Vital Sign & Baseline
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Korelasi fluktuasi denyut nadi dengan kebiasaan gaya hidup Anda.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="activity-overlay"
                            checked={showActivityOverlay}
                            onCheckedChange={setShowActivityOverlay}
                          />
                          <Label htmlFor="activity-overlay" className="text-xs font-semibold text-slate-700 cursor-pointer">
                            Penanda Aktivitas
                          </Label>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            id="hrv-comparison"
                            checked={showHrvComparison}
                            onCheckedChange={setShowHrvComparison}
                          />
                          <Label htmlFor="hrv-comparison" className="text-xs font-semibold text-slate-700 cursor-pointer">
                            Bandingkan HRV
                          </Label>
                        </div>

                        <ButtonGroup variant="secondary" className="bg-slate-100 p-1 rounded-full text-xs">
                          <Button
                            size="sm"
                            variant={timeRange === 'harian' ? 'default' : 'ghost'}
                            onClick={() => setTimeRange('harian')}
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
                            variant={timeRange === 'mingguan' ? 'default' : 'ghost'}
                            onClick={() => setTimeRange('mingguan')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              timeRange === 'mingguan'
                                ? 'bg-white text-slate-900 shadow-xs font-bold'
                                : 'text-slate-500'
                            }`}
                          >
                            Mingguan
                          </Button>
                          <Button
                            size="sm"
                            variant={timeRange === 'bulanan' ? 'default' : 'ghost'}
                            onClick={() => setTimeRange('bulanan')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              timeRange === 'bulanan'
                                ? 'bg-white text-slate-900 shadow-xs font-bold'
                                : 'text-slate-500'
                            }`}
                          >
                            Bulanan
                          </Button>
                        </ButtonGroup>
                      </div>
                    </div>

                    {/* MUI X Line Chart */}
                    <div className="w-full overflow-hidden">
                      <LineChart
                        series={[
                          {
                            id: 'hr-series',
                            data: currentChartData.map((d) => d.hr),
                            label: 'Detak Jantung (BPM)',
                            area: false,
                            curve: 'natural',
                            color: '#0E7490',
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
                                  color: '#D97706',
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
                              fontSize: 11,
                              fill: '#64748B',
                              fontWeight: 500,
                            },
                          },
                        ]}
                        yAxis={[
                          {
                            min: 40,
                            max: 95,
                            tickLabelStyle: {
                              fontSize: 11,
                              fill: '#64748B',
                              fontWeight: 500,
                            },
                            valueFormatter: (value: number | null) => (value != null ? `${value} BPM` : ''),
                          },
                        ]}
                        grid={{ horizontal: true }}
                        height={250}
                        margin={{ left: 55, right: 25, top: 25, bottom: 25 }}
                        sx={{
                          width: '100%',
                          '& .MuiChartsGrid-line': {
                            stroke: '#F1F5F9',
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
                          y={69}
                          label="Baseline: 69 BPM"
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
                          timeRange === 'harian' &&
                          activities.map((act) => {
                            const hour = Math.round(act.timestamp)
                            const hourLabel = `${String(hour).padStart(2, '0')}:00`
                            const exists = hourlyData.some((d) => d.label === hourLabel)
                            if (!exists) return null
                            const icon = act.category === 'kopi' ? '☕' : act.category === 'olahraga' ? '🏃' : '🍲'
                            return (
                              <ChartsReferenceLine
                                key={act.id}
                                x={hourLabel}
                                label={`${icon} ${act.title}`}
                                labelAlign="start"
                                lineStyle={{
                                  stroke: '#0E7490',
                                  strokeDasharray: '3 3',
                                  strokeWidth: 1.2,
                                }}
                                labelStyle={{
                                  fill: '#0E7490',
                                  fontSize: 10,
                                  fontWeight: 600,
                                }}
                              />
                            )
                          })}
                      </LineChart>
                    </div>

                    {/* Activity Chips (when Penanda Aktivitas is active on Harian view) */}
                    {showActivityOverlay && timeRange === 'harian' && activities.length > 0 && (
                      <div className="flex items-center gap-2 px-1 pt-1 pb-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-slate-500">Penanda Aktivitas Hari Ini:</span>
                        {activities.map((act) => (
                          <span
                            key={act.id}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-teal-50/80 text-teal-800 border border-teal-200/60 shadow-2xs"
                          >
                            <span>{act.category === 'kopi' ? '☕' : act.category === 'olahraga' ? '🏃' : '🍲'}</span>
                            <span className="font-semibold">{act.time}</span>
                            <span className="text-slate-400">•</span>
                            <span>{act.title} ({act.detail})</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Quick Logger Strip */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-700">Catat Cepat:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {categories.map((cat) => (
                          <Button
                            key={cat.key}
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedLogCategory(cat.key)
                              setIsLogModalOpen(true)
                            }}
                            className="px-2.5 py-1 rounded-full text-xs font-medium border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/40 cursor-pointer"
                          >
                            <span className="mr-1">{cat.icon}</span>
                            {cat.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* RIGHT COLUMN: 3 ANALYTICAL CARDS (4 COLS) */}
                <div className="lg:col-span-4 space-y-5">
                  {/* Card 1: Activity Breakdown (Donut Ring Chart) */}
                  <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-700">Porsi Aktivitas</h3>
                      <span className="text-xs text-slate-400 font-mono">↗</span>
                    </div>

                    <div className="flex items-center justify-center py-2">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
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
                          <span className="text-sm font-extrabold text-slate-900">100%</span>
                          <span className="text-[11px] text-slate-500 font-medium">Tercatat</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-3.5 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" /> Istirahat
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" /> Olahraga
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Kafein
                      </span>
                    </div>
                  </Card>

                  {/* Card 2: Weekly Workload / Trend (Bar Chart) */}
                  <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-700">Denyut Mingguan</h3>
                      <span className="text-xs text-slate-400 font-mono">↗</span>
                    </div>

                    {/* Vertical Bars for 7 days */}
                    <div className="h-28 flex items-end justify-between gap-2 pt-4 px-1">
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
                          <div className="w-full bg-slate-100 rounded-t-lg h-20 flex items-end justify-center p-0.5">
                            <div
                              style={{ height: item.height }}
                              className={`w-full rounded-t-md transition-all ${
                                item.highlight ? 'bg-indigo-700' : 'bg-indigo-500/70'
                              }`}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-500">{item.day}</span>
                        </div>
                      ))}
                    </div>

                    <div className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
                      Rata-rata: <strong className="text-slate-800 font-bold">71.8 BPM</strong>
                    </div>
                  </Card>

                  {/* Card 3: Health Score Gauge (Semicircle Speedometer) */}
                  <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-700">Skor Pemulihan</h3>
                      <span className="text-xs text-slate-400 font-mono">↗</span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="relative w-32 h-18 overflow-hidden flex items-end justify-center">
                        <svg viewBox="0 0 100 55" className="w-32 h-18">
                          {/* Background arc */}
                          <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            stroke="#E2E8F0"
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
                          <span className="text-2xl font-extrabold text-slate-900 block leading-none">
                            85%
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-teal-800 mt-1.5">Kondisi Prima</span>
                    </div>

                    <div className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
                      Zona Pemulihan Otonom Baik
                    </div>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>

        {/* 3. PERSISTENT DISCLAIMER FOOTER */}
        <footer className="pt-4 border-t border-slate-200/80 text-center text-xs text-slate-500 space-y-1">
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
      <Dialog open={isLogModalOpen} onOpenChange={setIsLogModalOpen}>
        <DialogContent className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5">
          <DialogHeader className="flex flex-row items-center gap-2 pb-3 border-b border-slate-100">
            <span className="text-2xl">
              {categories.find((c) => c.key === selectedLogCategory)?.icon}
            </span>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                Catat {categories.find((c) => c.key === selectedLogCategory)?.label}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Tambahkan detail catatan waktu & aktivitas</DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <TextField className="w-full">
              <Label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Catatan / Keterangan
              </Label>
              <Input
                placeholder="misal: 1 cangkir espresso / jalan pagi 30 menit"
                value={logDetail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLogDetail(e.target.value)}
                className="w-full text-xs"
              />
            </TextField>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Waktu Catat: Sekarang ({new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB)
              </span>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogModalOpen(false)}
              className="px-5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleAddActivity}
              className="px-6 py-2 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
            >
              Simpan Aktivitas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SIMULATED rPPG MEASUREMENT MODAL */}
      <Dialog open={isMeasureModalOpen} onOpenChange={setIsMeasureModalOpen}>
        <DialogContent className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-5">
          <DialogHeader className="space-y-1 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Pengukuran Vital Sign Kamera (rPPG)
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Pastikan wajah berada di dalam bingkai dan pencahayaan ruangan memadai.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
                Kualitas: {measuredPerson.signalQuality}%
              </div>

              {/* Bottom live stats */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs text-white">
                <span className="text-slate-300">Detak Estimasi:</span>
                <span className="font-mono font-bold text-teal-300">{measuredPerson.hr} BPM</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Memproses Sinyal Mikrovaskular Wajah...</span>
                <span className="text-teal-700 font-mono font-bold">100%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-teal-700 h-2 rounded-full w-full transition-all duration-500" />
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMeasureModalOpen(false)}
              className="px-5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Tutup
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsMeasureModalOpen(false)
                addAiMessage(
                  `Pengukuran rPPG selesai untuk ${measuredPerson.name}. Hasil: ${measuredPerson.hr} BPM, HRV ${measuredPerson.hrv} ms (${measuredPerson.status}). Kondisi terpantau stabil! 👍`,
                  true
                )
              }}
              className="px-6 py-2 rounded-full text-xs font-bold bg-teal-800 hover:bg-teal-900 text-white shadow-xs cursor-pointer"
            >
              Simpan & Perbarui Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Dashboard
