import React, { useState, useRef, useEffect } from 'react'
import {
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

interface ChatMessage {
  id: string
  sender: 'ai' | 'user'
  text: string
  time: string
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

  // Chatbot State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Halo Budi! 👋 Data vital rPPG Anda pagi ini menunjukkan 72 BPM & HRV 52 ms (stabil). Ada yang ingin Anda tanyakan seputar kondisi tubuh hari ini?',
      time: '08:31 WIB',
    },
    {
      id: '2',
      sender: 'user',
      text: 'Kenapa jam 10 tadi detak jantungku sempat naik ke 84 BPM?',
      time: '10:15 WIB',
    },
    {
      id: '3',
      sender: 'ai',
      text: 'Itu respon normal terhadap kafein dari 1 cangkir kopi hitam yang Anda catat pada 09:15 WIB. Setelah 1 jam, denyut Anda sudah berangsur kembali ke baseline normal 72 BPM. Pastikan cukup minum air putih ya! 💧',
      time: '10:16 WIB',
    },
  ])
  const [inputMessage, setInputMessage] = useState<string>('')
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isAiTyping])

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
  const svgWidth = 720
  const svgHeight = 220
  const padLeft = 40
  const padRight = 25
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

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text) return

    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: timeStr,
    }

    setChatMessages((prev) => [...prev, userMsg])
    if (!textToSend) setInputMessage('')
    setIsAiTyping(true)

    // Simulated intelligent response
    setTimeout(() => {
      let reply = 'Terima kasih atas pertanyaannya. Berdasarkan data vital rPPG terkini, parameter Anda berada dalam zona pemulihan yang sehat. Tetap jaga hidrasi dan istirahat teratur.'

      const lower = text.toLowerCase()
      if (lower.includes('baseline') || lower.includes('normal')) {
        reply = 'Baseline denyut jantung istirahat Anda adalah 69 BPM dengan rentang sehat 60-80 BPM. Nilai 72 BPM saat ini menunjukkan kondisi kardiovaskular yang stabil.'
      } else if (lower.includes('napas') || lower.includes('pernapasan') || lower.includes('relaksasi')) {
        reply = 'Laju napas Anda adalah 16 bpm (rileks). Jika merasa tegang, cobalah teknik 4-7-8: tarik napas 4 detik, tahan 7 detik, lalu hembuskan perlahan 8 detik.'
      } else if (lower.includes('kopi') || lower.includes('kafein')) {
        reply = 'Kafein merangsang saraf simpatis selama 1-2 jam pertama. Lonjakan kecil ke 84 BPM adalah wajar dan HRV Anda tetap menunjukkan pemulihan saraf otonom yang kuat.'
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`,
      }
      setChatMessages((prev) => [...prev, aiMsg])
      setIsAiTyping(false)
    }, 700)
  }

  return (
    <div className="min-h-screen bg-[#F0EEE6] text-slate-900 flex flex-col items-center justify-start p-3 sm:p-6 lg:p-8 font-sans antialiased">
      {/* MAIN CONTAINER (Matching Tablet-like Frame from Reference) */}
      <div className="w-full max-w-7xl bg-white/95 backdrop-blur-md rounded-[2.5rem] border border-stone-200/80 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] p-5 sm:p-7 md:p-9 space-y-7">
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

          {/* Right Utilities (Search, Notification, Avatar) */}
          <div className="flex items-center gap-3 self-end md:self-auto">
            {/* Quick search input */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-stone-100/80 border border-stone-200/70 rounded-full text-xs text-slate-500">
              <svg className="w-3.5 h-3.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Cari data vital...</span>
            </div>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200/80 flex items-center justify-center text-slate-700 relative transition cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 border-2 border-white" />
            </button>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2 pl-1 border-l border-stone-200">
              <Avatar size="sm" className="bg-teal-900 text-white font-bold text-xs shadow-xs">
                <Avatar.Fallback>BP</Avatar.Fallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* 2. SPLIT LAYOUT (LEFT 8 COLS: ANALYTICS / RIGHT 4 COLS: CHATBOT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* LEFT COLUMN: DASHBOARD ANALYTICS (8 COLS) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Greeting Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500 font-semibold tracking-wide">
                  Halo, Budi Pratama 👋
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Pantau Kesehatanmu Hari Ini
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <Chip size="sm" color="success" variant="soft" className="font-semibold text-xs">
                  Sinyal rPPG 98%
                </Chip>
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-slate-900 text-white rounded-full font-bold px-4 shadow-xs"
                >
                  Ukur Sekarang
                </Button>
              </div>
            </div>

            {/* ROW 1: 3 VITAL METRIC SUMMARY CARDS (Like Consultations, Satisfaction, Revenue in ref) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Metric 1: Heart Rate */}
              <Card className="p-5 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Detak Jantung</span>
                  <span className="text-xs text-stone-400 font-mono">↗</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">72</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">BPM</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <span className="text-slate-500 font-medium">Bln ini</span>
                  <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                    +3% Normal
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
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">52</span>
                  <span className="text-xs font-bold text-slate-400 uppercase">ms RMSSD</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                  <span className="text-slate-500 font-medium">Saraf Otonom</span>
                  <Chip size="sm" color="success" variant="soft" className="font-bold text-xs">
                    Optimal
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
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">16</span>
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
          </div>

          {/* RIGHT COLUMN: SAHABAT SEHAT AI CHATBOT (4 COLS) - Matching the tall gradient card from reference */}
          <div className="lg:col-span-4">
            <Card className="bg-gradient-to-b from-teal-800 via-teal-900 to-slate-950 text-white rounded-[2rem] p-5 sm:p-6 shadow-xl border border-teal-700/40 relative overflow-hidden flex flex-col justify-between min-h-[720px] space-y-5">
              {/* Chatbot Header */}
              <div className="space-y-3 pb-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-400 text-teal-950 flex items-center justify-center font-bold text-xs shadow-xs">
                      AI
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white tracking-tight leading-tight">
                        Sahabat Sehat AI
                      </h2>
                      <p className="text-xs text-teal-200/90">Konsultan Wellness Anda</p>
                    </div>
                  </div>

                  <Chip size="sm" color="success" variant="soft" className="text-xs font-bold bg-emerald-400/20 text-emerald-300 border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block mr-1" />
                    Online
                  </Chip>
                </div>

                {/* Mini Summary Capsule (matching the calendar day selector style in ref) */}
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center justify-between text-xs">
                  <span className="text-stone-300">Status Hari Ini:</span>
                  <span className="font-bold text-teal-300">72 BPM (Stabil)</span>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[440px] text-xs">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-teal-400 text-teal-950 font-semibold rounded-br-xs shadow-xs'
                          : 'bg-white/12 text-stone-100 rounded-bl-xs border border-white/10'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-xs text-stone-400 mt-1 px-1">
                      {msg.sender === 'user' ? 'Anda' : 'Sahabat AI'} &middot; {msg.time}
                    </span>
                  </div>
                ))}

                {isAiTyping && (
                  <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-white/10 text-teal-200 w-fit">
                    <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Quick Suggestions & Input */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                {/* Quick Prompts */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Berapa baseline normal saya?')}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-teal-200 whitespace-nowrap transition cursor-pointer"
                  >
                    Berapa baseline normal?
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Tips latihan pernapasan')}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-teal-200 whitespace-nowrap transition cursor-pointer"
                  >
                    Tips relaksasi
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendMessage('Pengaruh kafein hari ini')}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-teal-200 whitespace-nowrap transition cursor-pointer"
                  >
                    Pengaruh kopi
                  </button>
                </div>

                {/* Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Tanya kesehatanmu ke AI..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white placeholder:text-stone-400 text-xs focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className="p-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>
              </div>
            </Card>
          </div>
        </div>

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
    </div>
  )
}

export default Dashboard
