import React, { useState } from 'react'
import {
  Alert,
  Avatar,
  Button,
  ButtonGroup,
  Card,
  Chip,
  Input,
  Label,
  Modal,
  Switch,
  TextField,
} from '@heroui/react'

interface ActivityItem {
  id: string
  category: 'kopi' | 'olahraga' | 'tidur' | 'rokok' | 'makan' | 'alkohol'
  title: string
  detail: string
  time: string
  timestamp: number // for chart positioning
}

export const Dashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>('dashboard')
  const [timeRange, setTimeRange] = useState<'harian' | 'mingguan' | 'bulanan'>('harian')
  const [showActivityOverlay, setShowActivityOverlay] = useState<boolean>(true)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null)

  // Quick Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false)
  const [selectedLogCategory, setSelectedLogCategory] = useState<ActivityItem['category'] | null>(null)
  const [logDetail, setLogDetail] = useState<string>('')

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
  const svgWidth = 800
  const svgHeight = 260
  const padLeft = 45
  const padRight = 35
  const padTop = 30
  const padBottom = 40
  const plotWidth = svgWidth - padLeft - padRight
  const plotHeight = svgHeight - padTop - padBottom

  // Min/Max for HR scale
  const minHR = 50
  const maxHR = 100

  const getY = (val: number) => {
    const clamped = Math.max(minHR, Math.min(maxHR, val))
    return padTop + plotHeight - ((clamped - minHR) / (maxHR - minHR)) * plotHeight
  }

  const getX = (idx: number) => {
    return padLeft + (idx / (currentChartData.length - 1)) * plotWidth
  }

  // Generate SVG Path
  const hrPoints = currentChartData.map((d, i) => `${getX(i)},${getY(d.hr)}`).join(' ')
  const areaPoints = `${getX(0)},${padTop + plotHeight} ${hrPoints} ${getX(currentChartData.length - 1)},${padTop + plotHeight}`

  // Quick categories
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
    <div className="min-h-screen bg-[#F6F4EE] text-slate-900 flex flex-col font-sans antialiased">
      {/* 1. TOP BAR NAVIGATION */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 px-4 sm:px-8 py-3.5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-xs">
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
              <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                Nadiku
              </span>
              <span className="text-xs text-teal-800 font-semibold tracking-wide uppercase">
                Family Health Monitor
              </span>
            </div>
          </div>

          {/* Navigation Links with HeroUI Buttons */}
          <div className="hidden md:flex items-center gap-1 bg-stone-100/70 p-1 rounded-full border border-stone-200/70">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'rppg', label: 'Pengukuran rPPG' },
              { id: 'history', label: 'Riwayat & Tren' },
              { id: 'activity', label: 'Aktivitas' },
              { id: 'ai', label: 'AI Sahabat' },
              { id: 'family', label: 'Keluarga' },
            ].map((nav) => (
              <Button
                key={nav.id}
                size="sm"
                variant={activeNav === nav.id ? 'primary' : 'ghost'}
                onPress={() => setActiveNav(nav.id)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition ${
                  activeNav === nav.id
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {nav.label}
              </Button>
            ))}
          </div>

          {/* User Profile & Actions with HeroUI Avatar and Chip */}
          <div className="flex items-center gap-3">
            {/* Telegram Status indicator */}
            <Chip
              size="sm"
              color="accent"
              variant="soft"
              className="hidden sm:inline-flex font-semibold text-xs items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse inline-block mr-1" />
              Telegram Aktif
            </Chip>

            {/* Profile Avatar Pill with HeroUI Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <Avatar size="sm" className="bg-teal-900 text-white font-bold text-xs shadow-xs">
                <Avatar.Fallback>BP</Avatar.Fallback>
              </Avatar>
              <div className="hidden sm:block text-left leading-tight">
                <span className="text-xs font-bold text-slate-900 block">Budi Pratama</span>
                <span className="text-xs text-slate-500 font-medium">Akun Utama</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8 flex-1">
        {/* Header Greeting & Primary Action Card */}
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)]">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Halo, Budi Pratama 👋
            </h1>
            <div className="text-xs sm:text-sm text-slate-600 flex flex-wrap items-center gap-2 font-normal">
              <span>Pengukuran Terakhir: Hari ini, 08:30 WIB</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-300" />
              <Chip size="sm" color="success" variant="soft" className="font-semibold text-xs">
                Kualitas Sinyal Baik (98%)
              </Chip>
            </div>
          </div>

          <Button
            size="md"
            variant="primary"
            className="px-6 py-2.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 transition active:scale-95 shadow-xs"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>Mulai Pengukuran Baru</span>
          </Button>
        </Card>

        {/* 3. VITAL SIGNS METRIC CARDS WITH HEROUI CARD & CHIP */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Metric 1: Heart Rate */}
          <Card className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detak Jantung (HR)
                </span>
              </div>
              <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                Normal
              </Chip>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                72
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">BPM</span>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Baseline Personal: 69 BPM</span>
              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                <span>+3% (Stabil)</span>
              </span>
            </div>
          </Card>

          {/* Metric 2: HRV (RMSSD) */}
          <Card className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Variabilitas (HRV)
                </span>
              </div>
              <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                Optimal
              </Chip>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                52
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">ms (RMSSD)</span>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Pemulihan Saraf: Baik</span>
              <span className="text-emerald-700 font-bold">Kondisi Prima</span>
            </div>
          </Card>

          {/* Metric 3: Respiration Rate */}
          <Card className="bg-white rounded-2xl p-6 border border-stone-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"
                    />
                  </svg>
                </span>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Laju Pernapasan
                </span>
              </div>
              <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                Rileks
              </Chip>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
                16
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">nafas / mnt</span>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Rentang Normal: 12-20 bpm</span>
              <span className="text-slate-700 font-bold">Teratur</span>
            </div>
          </Card>
        </section>

        {/* 4. INTERACTIVE TIME-SERIES TREND CHART WITH ACTIVITY OVERLAY & HEROUI SWITCH */}
        <Card className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-6">
          {/* Chart Header & Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Tren & Korelasi Vital Sign
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                Memvisualisasikan dinamika denyut nadi dengan penanda aktivitas harian Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Activity Marker Toggle with HeroUI Switch */}
              <Switch
                isSelected={showActivityOverlay}
                onChange={setShowActivityOverlay}
              >
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Switch.Content className="text-xs font-semibold text-slate-700">
                  Penanda Aktivitas
                </Switch.Content>
              </Switch>

              {/* Time Range Tabs with HeroUI ButtonGroup */}
              <ButtonGroup variant="secondary" className="bg-stone-100 p-1 rounded-full text-xs">
                <Button
                  size="sm"
                  variant={timeRange === 'harian' ? 'primary' : 'ghost'}
                  onPress={() => setTimeRange('harian')}
                  className={`px-3.5 py-1 rounded-full transition text-xs font-semibold ${
                    timeRange === 'harian'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Harian
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === 'mingguan' ? 'primary' : 'ghost'}
                  onPress={() => setTimeRange('mingguan')}
                  className={`px-3.5 py-1 rounded-full transition text-xs font-semibold ${
                    timeRange === 'mingguan'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mingguan
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === 'bulanan' ? 'primary' : 'ghost'}
                  onPress={() => setTimeRange('bulanan')}
                  className={`px-3.5 py-1 rounded-full transition text-xs font-semibold ${
                    timeRange === 'bulanan'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Bulanan
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* SVG Canvas */}
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full min-w-[650px] h-[260px] overflow-visible select-none"
            >
              <defs>
                <linearGradient id="tealAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0E7490" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#0E7490" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal Lines */}
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
                      x={padLeft - 10}
                      y={y + 4}
                      textAnchor="end"
                      className="text-xs font-mono fill-stone-400 font-semibold"
                    >
                      {hrVal}
                    </text>
                  </g>
                )
              })}

              {/* Baseline Reference Dashed Line (69 BPM) */}
              <line
                x1={padLeft}
                y1={getY(69)}
                x2={svgWidth - padRight}
                y2={getY(69)}
                stroke="#10B981"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeOpacity="0.7"
              />
              <text
                x={svgWidth - padRight - 5}
                y={getY(69) - 6}
                textAnchor="end"
                className="text-xs fill-emerald-800 font-bold"
              >
                Baseline: 69 BPM
              </text>

              {/* Filled Area */}
              <polygon points={areaPoints} fill="url(#tealAreaGrad)" />

              {/* Main Trend Line */}
              <polyline
                points={hrPoints}
                fill="none"
                stroke="#0E7490"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points & Tooltip Targets */}
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

                    {/* Bottom X-Axis Label */}
                    <text
                      x={cx}
                      y={padTop + plotHeight + 20}
                      textAnchor="middle"
                      className="text-xs fill-slate-500 font-medium"
                    >
                      {d.label}
                    </text>

                    {/* Hover Tooltip Popup */}
                    {isHovered && (
                      <g>
                        <rect
                          x={cx - 45}
                          y={cy - 48}
                          width="90"
                          height="36"
                          rx="8"
                          className="fill-slate-900 shadow-md"
                        />
                        <text
                          x={cx}
                          y={cy - 32}
                          textAnchor="middle"
                          className="text-xs fill-stone-300 font-medium"
                        >
                          {d.time}
                        </text>
                        <text
                          x={cx}
                          y={cy - 18}
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

              {/* Activity Overlay Markers */}
              {showActivityOverlay &&
                timeRange === 'harian' &&
                activities.map((act) => {
                  const dataIndex = hourlyData.findIndex(
                    (d) => Number(d.time.split(':')[0]) === Math.floor(act.timestamp)
                  )
                  if (dataIndex === -1) return null
                  const actX = getX(dataIndex)
                  const actY = getY(hourlyData[dataIndex].hr) - 26

                  return (
                    <g key={act.id} className="cursor-pointer group">
                      <line
                        x1={actX}
                        y1={actY + 12}
                        x2={actX}
                        y2={getY(hourlyData[dataIndex].hr)}
                        stroke="#0E7490"
                        strokeWidth="1.2"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={actX}
                        cy={actY}
                        r="12"
                        className="fill-white stroke-stone-300 stroke-1.5 shadow-xs group-hover:scale-110 transition-transform"
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
                            : act.category === 'makan'
                              ? '🍲'
                              : '📝'}
                      </text>
                    </g>
                  )
                })}
            </svg>
          </div>
        </Card>

        {/* 5. LOWER SPLIT: QUICK ACTIVITY LOGGER (LEFT) & ANOMALY / AI INSIGHT (RIGHT) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Quick Activity Logging with HeroUI Card */}
          <Card className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Catat Aktivitas Harian
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Satu ketukan untuk menghubungkan kebiasaan gaya hidup dengan grafik vital Anda.
                </p>
              </div>

              <Chip size="sm" color="accent" variant="soft" className="font-bold text-xs">
                {activities.length} Hari Ini
              </Chip>
            </div>

            {/* Quick 6 Category Buttons with HeroUI Button */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {categories.map((cat) => (
                <Button
                  key={cat.key}
                  variant="outline"
                  onPress={() => {
                    setSelectedLogCategory(cat.key)
                    setIsLogModalOpen(true)
                  }}
                  className="p-3 h-auto rounded-2xl border border-stone-200 hover:border-teal-700 hover:bg-teal-50/40 text-center transition flex flex-col items-center gap-1.5 active:scale-95 group cursor-pointer"
                >
                  <span className="text-xl group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </span>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-teal-900">
                    {cat.label}
                  </span>
                </Button>
              ))}
            </div>

            {/* Recent Activities List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Riwayat Aktivitas Terakhir
              </h3>

              <div className="divide-y divide-stone-100 border border-stone-100 rounded-2xl overflow-hidden">
                {activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 flex items-center justify-between hover:bg-stone-50/60 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-sm">
                        {act.category === 'kopi'
                          ? '☕'
                          : act.category === 'olahraga'
                            ? '🏃'
                            : act.category === 'makan'
                              ? '🍲'
                              : '🌙'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                        <p className="text-xs text-slate-500">{act.detail}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-600 block">
                        {act.time}
                      </span>
                      <span className="text-xs text-teal-700 font-medium">Terekam</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Right Column: Anomaly Alert & AI Health Companion Insight (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Anomaly Detection Status Card with HeroUI Alert */}
            <Card className="bg-white rounded-2xl sm:rounded-3xl p-6 border border-stone-200/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Deteksi Anomali
                </span>
                <Chip size="sm" color="warning" variant="soft" className="font-bold text-xs">
                  Perlu Perhatian (Sedang)
                </Chip>
              </div>

              {/* Anomaly Alert */}
              <Alert status="warning" className="rounded-2xl border border-amber-200 bg-amber-50/70">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title className="text-xs font-bold text-amber-950">
                    Peningkatan HR Sementara Terdeteksi
                  </Alert.Title>
                  <Alert.Description className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                    Detak jantung naik ke <strong>84 BPM</strong> (+15 BPM di atas baseline) pada
                    pukul 10:00 WIB.
                    <div className="pt-2 text-xs text-slate-600 border-t border-amber-200/60 mt-2 font-normal">
                      <span className="font-semibold text-slate-700">Konteks Terkait:</span> 45 menit
                      setelah Anda mencatat 1 cangkir kopi hitam.
                    </div>
                  </Alert.Description>
                </Alert.Content>
              </Alert>
            </Card>

            {/* AI Health Companion Insight Widget */}
            <Card className="bg-gradient-to-br from-teal-900 to-slate-900 text-white rounded-2xl sm:rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden border border-teal-950">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center font-bold text-sm">
                  AI
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Sahabat Sehat Nadiku
                  </h3>
                  <p className="text-xs text-teal-200/90">
                    Menganalisis data vital & riwayat keluarga Anda
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-200 leading-relaxed font-normal bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
                &ldquo;Pola denyut nadi Anda menunjukkan respon normal terhadap kafein. Pada pukul
                11:00, detak jantung sudah berangsur turun ke 76 BPM dan HRV Anda tetap dalam zona
                pemulihan yang baik.&rdquo;
              </p>

              <Button
                variant="primary"
                size="md"
                className="w-full py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-teal-950 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 shadow-xs cursor-pointer"
              >
                <span>Tanya AI tentang Tren Hari Ini</span>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </Card>
          </div>
        </section>
      </main>

      {/* 6. PERSISTENT MEDICAL DISCLAIMER FOOTER */}
      <footer className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 text-center text-xs text-slate-500 space-y-2 border-t border-stone-200/70 mt-8">
        <p className="text-slate-600 font-medium">
          <strong>Pernyataan Non-Medis:</strong> Nadiku adalah platform pemantauan kebugaran dan
          wellness berbasis rPPG & ML Anomaly Detection. Hasil pengukuran bersifat informasional dan
          tidak menggantikan diagnosis, pemeriksaan medis klinis, atau konsultasi dokter.
        </p>
        <p className="text-xs text-stone-500">
          Nadiku &copy; 2026 &middot; Didesain dengan prinsip ketenangan dan kepedulian keluarga.
        </p>
      </footer>

      {/* QUICK LOG MODAL WITH HEROUI MODAL */}
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
    </div>
  )
}

export default Dashboard
