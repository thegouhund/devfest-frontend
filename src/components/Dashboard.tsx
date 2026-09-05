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
  const svgWidth = 760
  const svgHeight = 240
  const padLeft = 40
  const padRight = 30
  const padTop = 25
  const padBottom = 35
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
      <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-stone-200/80 px-4 sm:px-8 py-3">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
          {/* Brand Logo & Clinical Monogram */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold shadow-xs">
              <svg
                className="w-4 h-4 text-white"
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
                Family Health Sanctuary
              </span>
            </div>
          </div>

          {/* Navigation Links with HeroUI Buttons */}
          <div className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-full border border-stone-200/60">
            {[
              { id: 'dashboard', label: 'Ringkasan' },
              { id: 'rppg', label: 'Pengukuran rPPG' },
              { id: 'history', label: 'Tren Vital' },
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

          {/* User Profile & Telegram Status */}
          <div className="flex items-center gap-3">
            <Chip
              size="sm"
              color="accent"
              variant="soft"
              className="hidden sm:inline-flex font-semibold text-xs items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-pulse inline-block mr-1" />
              Telegram Bot Aktif
            </Chip>

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

      {/* 2. MAIN SANCTUARY CONTENT */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-8 flex-1">
        {/* Natural Header Flow (Organic, Not a boxed card) */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-semibold text-teal-900 uppercase tracking-wider">
                Kondisi Fisiologis Terkalibrasi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Selamat Pagi, Budi
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Pemeriksaan rPPG terakhir dicatat pukul <strong>08:30 WIB</strong> &middot; Kualitas sinyal 98% (Sangat Baik).
            </p>
          </div>

          {/* Primary Action Button */}
          <Button
            size="md"
            variant="primary"
            className="px-6 py-2.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 transition active:scale-95 shadow-sm shrink-0 self-start sm:self-auto"
          >
            <svg
              className="w-4 h-4 text-emerald-400"
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
            <span>Mulai Pengukuran rPPG Baru</span>
          </Button>
        </header>

        {/* 3. VITAL TELEMETRY HUB (A Single Cohesive Sanctuary Panel, not 3 disconnected SaaS cards) */}
        <Card className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Primary Focal Metric: Detak Jantung (Heart Rate) - 5 Cols */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Detak Jantung Istirahat (HR)
                </span>
                <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                  Normal & Stabil
                </Chip>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight font-mono">
                  72
                </span>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                  BPM
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  +3% di atas baseline
                </span>
                <span>Baseline personal Anda: 69 BPM</span>
              </div>
            </div>

            {/* Vertical Hairline Divider for Desktop */}
            <div className="hidden lg:block w-[1px] h-24 bg-stone-200" />

            {/* Companion Metric 1: HRV (RMSSD) - 3.5 Cols */}
            <div className="lg:col-span-3 space-y-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  Variabilitas (HRV)
                </span>
                <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                  Optimal
                </Chip>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                  52
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">ms RMSSD</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Pemulihan saraf otonom parasimpatis berada dalam kondisi prima.
              </p>
            </div>

            {/* Companion Metric 2: Laju Pernapasan (Respiration) - 3 Cols */}
            <div className="lg:col-span-3 space-y-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-stone-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Laju Pernapasan
                </span>
                <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                  Rileks
                </Chip>
              </div>

              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
                  16
                </span>
                <span className="text-xs font-bold text-slate-500 uppercase">nafas / mnt</span>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Irama pernapasan teratur dalam batas wajar orang dewasa (12-20 bpm).
              </p>
            </div>
          </div>

          {/* Unified Clinical Telemetry Status Strip */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 bg-stone-50/70 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span>Sensor Optik Kamera: Resolusi stabil 30 FPS tanpa jitter sinyal.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">&middot;</span>
              <span>Terhubung dengan: Keluarga Pratama (4 Anggota)</span>
            </div>
          </div>
        </Card>

        {/* 4. CHRONOLOGICAL TELEMETRY TIMELINE & JOURNAL (Asymmetric 8 cols / 4 cols Layout) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: 8 Columns - The Day's Flow (Vital Trend Curve & Timeline Correlation) */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-6">
              {/* Timeline Header & Control Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                    Bio-Ritme & Dinamika Harian
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Memvisualisasikan korelasi denyut nadi dengan kebiasaan gaya hidup Anda.
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

                  {/* Time Range Filter with HeroUI ButtonGroup */}
                  <ButtonGroup variant="secondary" className="bg-stone-100 p-1 rounded-full text-xs">
                    <Button
                      size="sm"
                      variant={timeRange === 'harian' ? 'primary' : 'ghost'}
                      onPress={() => setTimeRange('harian')}
                      className={`px-3 py-1 rounded-full transition text-xs font-semibold ${
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
                      className={`px-3 py-1 rounded-full transition text-xs font-semibold ${
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
                      className={`px-3 py-1 rounded-full transition text-xs font-semibold ${
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

              {/* Responsive SVG Chart */}
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full min-w-[620px] h-[240px] overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="tealAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0E7490" stopOpacity="0.14" />
                      <stop offset="100%" stopColor="#0E7490" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Reference Grid */}
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

                  {/* Shaded Area */}
                  <polygon points={areaPoints} fill="url(#tealAreaGrad)" />

                  {/* Main Curve */}
                  <polyline
                    points={hrPoints}
                    fill="none"
                    stroke="#0E7490"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points & Tooltip */}
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

                        {/* X-Axis Label */}
                        <text
                          x={cx}
                          y={padTop + plotHeight + 18}
                          textAnchor="middle"
                          className="text-xs fill-slate-500 font-medium"
                        >
                          {d.label}
                        </text>

                        {/* Hover Telemetry Card */}
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
                              className="text-xs fill-white font-bold font-mono"
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
                      const actY = getY(hourlyData[dataIndex].hr) - 24

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
                            r="11"
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

              {/* Integrated Lifestyle Event Feed */}
              <div className="pt-4 border-t border-stone-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Korelasi Catatan Hari Ini ({activities.length})
                  </span>
                  <span className="text-xs text-slate-500">Urutan Kronologis</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-stone-50/70 border border-stone-200/80 rounded-2xl flex items-center gap-2.5"
                    >
                      <span className="text-lg">{categories.find((c) => c.key === act.category)?.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{act.title}</h4>
                          <span className="text-xs text-slate-500 shrink-0">{act.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{act.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          {/* RIGHT: 4 Columns - Lifestyle Check-In & Human Clinical Advisory Note */}
          <div className="lg:col-span-4 space-y-6">
            {/* Lifestyle Quick Logger Card */}
            <Card className="bg-white rounded-3xl p-6 border border-stone-200/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Catat Aktivitas Cepat
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Satu ketukan untuk mengaitkan kebiasaan dengan kurva fisiologis.
                </p>
              </div>

              {/* 6 Category Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <Button
                    key={cat.key}
                    variant="outline"
                    onPress={() => {
                      setSelectedLogCategory(cat.key)
                      setIsLogModalOpen(true)
                    }}
                    className="p-2.5 h-auto rounded-xl border border-stone-200 hover:border-teal-700 hover:bg-teal-50/40 text-center transition flex flex-col items-center gap-1 active:scale-95 group cursor-pointer"
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </span>
                    <span className="text-xs font-bold text-slate-700 group-hover:text-teal-900">
                      {cat.label}
                    </span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Editorial Health Advisory Note (Warm, Human, Calm - NO generic neon AI gradient) */}
            <Card className="bg-[#FCFBF8] rounded-3xl p-6 border border-stone-200/90 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-teal-800 text-white flex items-center justify-center font-bold text-xs">
                    N
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Catatan Pendamping Sehat
                  </h3>
                </div>
                <Chip size="sm" color="accent" variant="soft" className="font-semibold text-xs">
                  Analisis Konteks
                </Chip>
              </div>

              {/* Contextual Alert for Coffee Spike */}
              <Alert status="warning" className="rounded-2xl border border-amber-200 bg-amber-50/60">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title className="text-xs font-bold text-amber-950">
                    Respon Fisiologis Kafein Terdeteksi
                  </Alert.Title>
                  <Alert.Description className="text-xs text-amber-900/90 mt-0.5 leading-relaxed">
                    Detak jantung sempat naik ke <strong>84 BPM</strong> pada 10:00 WIB (+15 BPM di atas baseline), bertepatan 45 menit setelah Anda mencatat 1 cangkir kopi hitam.
                  </Alert.Description>
                </Alert.Content>
              </Alert>

              {/* Reassuring Clinical Guidance */}
              <p className="text-xs text-slate-700 leading-relaxed font-normal bg-white/80 p-3.5 rounded-2xl border border-stone-200/60">
                &ldquo;Pola ini merupakan respon normal sistem kardiovaskular terhadap kafein. Pada pukul 11:00 WIB, ritme denyut telah berangsur turun ke 76 BPM dan HRV Anda tetap berada dalam ambang pemulihan optimal.&rdquo;
              </p>

              {/* Consultation Action */}
              <Button
                variant="outline"
                size="sm"
                className="w-full py-2.5 rounded-xl border-stone-300 text-slate-800 hover:bg-stone-100 text-xs font-bold transition shadow-xs"
              >
                Tanyakan Pola Tren ke Pendamping Sehat
              </Button>
            </Card>
          </div>
        </section>
      </main>

      {/* 5. PERSISTENT MEDICAL DISCLAIMER FOOTER */}
      <footer className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 text-center text-xs text-slate-500 space-y-2 border-t border-stone-200/70 mt-8">
        <p className="text-slate-600 font-medium">
          <strong>Pernyataan Non-Medis:</strong> Nadiku adalah platform pemantauan kebugaran dan wellness berbasis rPPG & ML Anomaly Detection. Hasil pengukuran bersifat informasional dan tidak menggantikan diagnosis, pemeriksaan medis klinis, atau konsultasi dokter.
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
