import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { UserProfile } from './Dashboard'

interface HistoryAndTrendsProps {
  member: UserProfile
}

export interface VitalHistoryItem {
  id: number
  timestamp: number
  daysAgo: number
  date: string
  time: string
  hr: number
  hrv: number
  rr: number
  status: 'Normal' | 'Perhatian' | 'Waspada'
  quality: number
  note: string
  videoUrl: string
  isCalibrating?: boolean
  baselineHr?: number
  baselineHrv?: number
  insight?: string
}

// Mock historical data spanning across 30 days
const historyLogs: VitalHistoryItem[] = [
  {
    id: 1,
    timestamp: new Date('2026-09-05T08:30:00').getTime(),
    daysAgo: 0,
    date: '5 Sep 2026',
    time: '08:30 WIB',
    hr: 72,
    hrv: 52,
    rr: 16,
    status: 'Normal',
    quality: 98,
    note: 'Pagi hari setelah sarapan ringan',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 70,
    baselineHrv: 50,
  },
  {
    id: 2,
    timestamp: new Date('2026-09-04T19:45:00').getTime(),
    daysAgo: 1,
    date: '4 Sep 2026',
    time: '19:45 WIB',
    hr: 78,
    hrv: 46,
    rr: 18,
    status: 'Normal',
    quality: 95,
    note: 'Setelah makan malam santai',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 72,
    baselineHrv: 48,
  },
  {
    id: 3,
    timestamp: new Date('2026-09-04T07:15:00').getTime(),
    daysAgo: 1,
    date: '4 Sep 2026',
    time: '07:15 WIB',
    hr: 69,
    hrv: 54,
    rr: 15,
    status: 'Normal',
    quality: 97,
    note: 'Bangun tidur pagi segar',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 70,
    baselineHrv: 50,
  },
  {
    id: 4,
    timestamp: new Date('2026-09-03T14:20:00').getTime(),
    daysAgo: 2,
    date: '3 Sep 2026',
    time: '14:20 WIB',
    hr: 88,
    hrv: 35,
    rr: 20,
    status: 'Perhatian',
    quality: 92,
    note: 'Setelah minum kopi espresso ganda',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 70,
    baselineHrv: 50,
    insight: 'Terdeteksi lonjakan detak jantung (+18 BPM) yang kurang biasa untuk aktivitas istirahat Anda.',
  },
  {
    id: 5,
    timestamp: new Date('2026-09-03T08:00:00').getTime(),
    daysAgo: 2,
    date: '3 Sep 2026',
    time: '08:00 WIB',
    hr: 71,
    hrv: 53,
    rr: 15,
    status: 'Normal',
    quality: 99,
    note: 'Pagi hari sebelum aktivitas kantor',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 70,
    baselineHrv: 50,
  },
  {
    id: 6,
    timestamp: new Date('2026-09-02T21:10:00').getTime(),
    daysAgo: 3,
    date: '2 Sep 2026',
    time: '21:10 WIB',
    hr: 67,
    hrv: 56,
    rr: 14,
    status: 'Normal',
    quality: 96,
    note: 'Sebelum istirahat malam santai',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 70,
    baselineHrv: 52,
  },
  {
    id: 7,
    timestamp: new Date('2026-09-02T12:30:00').getTime(),
    daysAgo: 3,
    date: '2 Sep 2026',
    time: '12:30 WIB',
    hr: 82,
    hrv: 42,
    rr: 17,
    status: 'Normal',
    quality: 94,
    note: 'Istirahat makan siang',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 71,
    baselineHrv: 49,
  },
  {
    id: 8,
    timestamp: new Date('2026-09-01T07:30:00').getTime(),
    daysAgo: 4,
    date: '1 Sep 2026',
    time: '07:30 WIB',
    hr: 70,
    hrv: 51,
    rr: 16,
    status: 'Normal',
    quality: 98,
    note: 'Pagi hari sebelum jalan santai',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 70,
    baselineHrv: 50,
  },
  {
    id: 9,
    timestamp: new Date('2026-08-31T18:40:00').getTime(),
    daysAgo: 5,
    date: '31 Agu 2026',
    time: '18:40 WIB',
    hr: 86,
    hrv: 38,
    rr: 19,
    status: 'Perhatian',
    quality: 91,
    note: 'Kelelahan setelah lembur kerja',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 70,
    baselineHrv: 50,
    insight: 'Variabilitas detak jantung (HRV) turun ke 38 ms, indikasi stres fisik atau kelelahan kerja.',
  },
  {
    id: 10,
    timestamp: new Date('2026-08-30T09:15:00').getTime(),
    daysAgo: 6,
    date: '30 Agu 2026',
    time: '09:15 WIB',
    hr: 73,
    hrv: 49,
    rr: 16,
    status: 'Normal',
    quality: 97,
    note: 'Akhir pekan santai di rumah',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 71,
    baselineHrv: 50,
  },
  {
    id: 11,
    timestamp: new Date('2026-08-29T16:20:00').getTime(),
    daysAgo: 7,
    date: '29 Agu 2026',
    time: '16:20 WIB',
    hr: 83,
    hrv: 44,
    rr: 18,
    status: 'Normal',
    quality: 93,
    note: 'Setelah aktivitas jalan sore 20 menit',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 71,
    baselineHrv: 48,
  },
  {
    id: 12,
    timestamp: new Date('2026-08-27T13:45:00').getTime(),
    daysAgo: 9,
    date: '27 Agu 2026',
    time: '13:45 WIB',
    hr: 91,
    hrv: 33,
    rr: 21,
    status: 'Waspada',
    quality: 90,
    note: 'Merasa cemas & sesak napas ringan',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: false,
    baselineHr: 70,
    baselineHrv: 50,
    insight: 'BPM melonjak ke 91 dengan laju respirasi meningkat ke 21 bpm. Dianjurkan istirahat tenang.',
  },
  {
    id: 13,
    timestamp: new Date('2026-08-25T08:00:00').getTime(),
    daysAgo: 11,
    date: '25 Agu 2026',
    time: '08:00 WIB',
    hr: 71,
    hrv: 50,
    rr: 16,
    status: 'Normal',
    quality: 96,
    note: 'Pengukuran awal siklus harian',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: true,
  },
  {
    id: 14,
    timestamp: new Date('2026-08-20T08:10:00').getTime(),
    daysAgo: 16,
    date: '20 Agu 2026',
    time: '08:10 WIB',
    hr: 74,
    hrv: 48,
    rr: 17,
    status: 'Normal',
    quality: 95,
    note: 'Kalibrasi kamera & sensor rPPG',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: true,
  },
  {
    id: 15,
    timestamp: new Date('2026-08-15T08:00:00').getTime(),
    daysAgo: 21,
    date: '15 Agu 2026',
    time: '08:00 WIB',
    hr: 72,
    hrv: 51,
    rr: 16,
    status: 'Normal',
    quality: 97,
    note: 'Pencatatan profil kesehatan baseline',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    isCalibrating: true,
  },
]

type SortField = 'date' | 'note' | 'hr' | 'hrv' | 'rr' | 'quality' | 'status'

export const HistoryAndTrends: React.FC<HistoryAndTrendsProps> = ({ member }) => {
  const [selectedLog, setSelectedLog] = useState<VitalHistoryItem | null>(null)
  const [period, setPeriod] = useState<'7 Hari' | '14 Hari' | '30 Hari'>('7 Hari')
  const [searchQuery, setSearchQuery] = useState('')

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)

  // Filter logs by period and search query
  const filteredLogs = useMemo(() => {
    return historyLogs.filter((log) => {
      // Period filter
      if (period === '7 Hari' && log.daysAgo > 7) return false
      if (period === '14 Hari' && log.daysAgo > 14) return false
      if (period === '30 Hari' && log.daysAgo > 30) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        log.note.toLowerCase().includes(q) ||
        log.status.toLowerCase().includes(q) ||
        log.date.toLowerCase().includes(q) ||
        log.time.toLowerCase().includes(q) ||
        log.hr.toString().includes(q) ||
        log.hrv.toString().includes(q) ||
        log.rr.toString().includes(q)
      )
    })
  }, [period, searchQuery])

  // Sort logs
  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let comparison = 0
      if (sortField === 'date') {
        comparison = a.timestamp - b.timestamp
      } else if (sortField === 'hr') {
        comparison = a.hr - b.hr
      } else if (sortField === 'hrv') {
        comparison = a.hrv - b.hrv
      } else if (sortField === 'rr') {
        comparison = a.rr - b.rr
      } else if (sortField === 'quality') {
        comparison = a.quality - b.quality
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status)
      } else if (sortField === 'note') {
        comparison = a.note.localeCompare(b.note)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredLogs, sortField, sortOrder])

  // Pagination calculation
  const totalItems = sortedLogs.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedLogs = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize
    return sortedLogs.slice(start, start + pageSize)
  }, [sortedLogs, safeCurrentPage, pageSize])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-600 transition-colors" />
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-teal-700 font-bold" />
    }
    return <ArrowDown className="w-3.5 h-3.5 text-teal-700 font-bold" />
  }

  // Generate page numbers with ellipsis
  const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }
    const pages: (number | 'ellipsis')[] = []
    pages.push(1)

    if (current > 3) {
      pages.push('ellipsis')
    }

    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('ellipsis')
    }

    pages.push(total)
    return pages
  }

  const pageNumbers = getPageNumbers(safeCurrentPage, totalPages)

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Riwayat & Tren BPM</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Log riwayat pengukuran vital sign untuk {member.name}
          </p>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-1 bg-stone-100 p-1 rounded-full text-xs">
          {(['7 Hari', '14 Hari', '30 Hari'] as const).map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'ghost'}
              onClick={() => {
                setPeriod(p)
                setCurrentPage(1)
              }}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-full text-xs font-semibold h-auto transition-all ${
                period === p ? 'bg-white text-slate-900 shadow-xs hover:bg-white/90' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* History Log Data Table Card */}
      <Card className="rounded-3xl bg-white border border-stone-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Log Riwayat Pengukuran</h3>
            <p className="text-xs text-slate-500 mt-0.5">Klik pada baris untuk melihat rekaman video & detail lengkap</p>
          </div>
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari catatan, tanggal, status, atau BPM..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-3 h-9 bg-stone-50 border-stone-200 hover:bg-stone-100 rounded-xl text-sm placeholder:text-slate-400 font-medium focus-visible:border-teal-700 focus-visible:ring-teal-700/30 transition-colors shadow-xs"
            />
          </div>
        </div>

        {/* Shadcn Table */}
        <Table>
          <TableHeader className="bg-stone-50/80 border-b border-stone-100">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-5 py-3.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('date')}
                  className="-ml-2 h-8 px-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 flex items-center gap-1 group"
                >
                  Waktu
                  {renderSortIcon('date')}
                </Button>
              </TableHead>
              <TableHead className="px-5 py-3.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('note')}
                  className="-ml-2 h-8 px-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 flex items-center gap-1 group"
                >
                  Kondisi / Catatan
                  {renderSortIcon('note')}
                </Button>
              </TableHead>
              <TableHead className="px-5 py-3.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('hr')}
                  className="-ml-2 h-8 px-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 flex items-center gap-1 group"
                >
                  BPM
                  {renderSortIcon('hr')}
                </Button>
              </TableHead>
              <TableHead className="px-5 py-3.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('hrv')}
                  className="-ml-2 h-8 px-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 flex items-center gap-1 group"
                >
                  HRV
                  {renderSortIcon('hrv')}
                </Button>
              </TableHead>
              <TableHead className="px-5 py-3.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('rr')}
                  className="-ml-2 h-8 px-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 flex items-center gap-1 group"
                >
                  Respirasi
                  {renderSortIcon('rr')}
                </Button>
              </TableHead>
              <TableHead className="px-5 py-3.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('quality')}
                  className="-ml-2 h-8 px-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 flex items-center gap-1 group"
                >
                  Kualitas
                  {renderSortIcon('quality')}
                </Button>
              </TableHead>
              <TableHead className="px-5 py-3.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort('status')}
                  className="-ml-2 h-8 px-2 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 flex items-center gap-1 group"
                >
                  Status
                  {renderSortIcon('status')}
                </Button>
              </TableHead>
              <TableHead className="px-5 py-3.5 text-right text-xs font-bold text-slate-700">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-stone-100">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                >
                  <TableCell className="px-5 py-4">
                    <div className="text-sm font-bold text-slate-900">{log.date}</div>
                    <div className="text-xs text-slate-500 font-medium">{log.time}</div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-sm text-slate-700">{log.note}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-slate-900">{log.hr}</span>
                      {!log.isCalibrating && log.baselineHr && (
                        <span
                          className={`text-[10px] font-bold ${
                            log.hr > log.baselineHr ? 'text-rose-500' : 'text-teal-600'
                          }`}
                        >
                          {log.hr > log.baselineHr ? '↑' : '↓'} {Math.abs(log.hr - log.baselineHr)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-700">
                        {log.hrv} <span className="text-xs text-slate-400 font-normal">ms</span>
                      </span>
                      {!log.isCalibrating && log.baselineHrv && (
                        <span
                          className={`text-[10px] font-bold ${
                            log.hrv > log.baselineHrv ? 'text-teal-600' : 'text-amber-500'
                          }`}
                        >
                          {log.hrv > log.baselineHrv ? '↑' : '↓'} {Math.abs(log.hrv - log.baselineHrv)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-sm font-bold text-slate-700">
                      {log.rr} <span className="text-xs text-slate-400 font-normal">bpm</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-sm text-slate-600 font-medium">{log.quality}%</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      variant="outline"
                      className={`font-bold text-[10px] uppercase shadow-xs pointer-events-none border-0 ${
                        log.isCalibrating
                          ? 'bg-sky-100 text-sky-800'
                          : log.status === 'Perhatian' || log.status === 'Waspada'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {log.isCalibrating ? 'Mempelajari Pola' : log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold h-8 text-teal-700 border-teal-200 bg-teal-50 hover:bg-teal-100 hover:text-teal-800 group-hover:border-teal-300"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedLog(log)
                      }}
                    >
                      Detail
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="px-5 py-12 text-center">
                  <span className="text-slate-500 font-medium text-sm">
                    Tidak ada riwayat yang cocok dengan pencarian "{searchQuery}"
                  </span>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Shadcn Pagination Controls Bar */}
        <div className="p-4 sm:p-5 border-t border-stone-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 bg-stone-50/50">
          <div className="text-center md:text-left w-full md:w-auto font-medium">
            Menampilkan {totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}-
            {Math.min(safeCurrentPage * pageSize, totalItems)} dari {totalItems} data
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 w-full md:w-auto">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-600">Tampilkan</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[72px] bg-white border-stone-200 text-xs font-semibold text-slate-700">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span className="hidden sm:inline font-medium text-slate-600">per halaman</span>
            </div>

            {/* Pagination Navigation */}
            <Pagination className="mx-0 w-auto">
              <PaginationContent className="gap-1">
                {/* First Page */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-white border-stone-200 text-slate-600 hover:bg-stone-100 disabled:opacity-40"
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage <= 1}
                    title="Halaman Pertama"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </Button>
                </PaginationItem>

                {/* Previous Page */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-white border-stone-200 text-slate-600 hover:bg-stone-100 disabled:opacity-40"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                </PaginationItem>

                {/* Page Numbers */}
                {pageNumbers.map((page, idx) =>
                  page === 'ellipsis' ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis className="h-8 w-8 text-slate-400" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={`page-${page}`}>
                      <PaginationLink
                        href="#"
                        isActive={safeCurrentPage === page}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(page as number)
                        }}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                          safeCurrentPage === page
                            ? 'bg-teal-700 text-white border-teal-700 hover:bg-teal-800 hover:text-white'
                            : 'bg-white border-stone-200 text-slate-700 hover:bg-stone-100'
                        }`}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                {/* Next Page */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-white border-stone-200 text-slate-600 hover:bg-stone-100 disabled:opacity-40"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </PaginationItem>

                {/* Last Page */}
                <PaginationItem>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg bg-white border-stone-200 text-slate-600 hover:bg-stone-100 disabled:opacity-40"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage >= totalPages}
                    title="Halaman Terakhir"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open: boolean) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-stone-200 shadow-xl">
          <DialogHeader className="pb-3 border-b border-stone-100 pr-8">
            <DialogTitle className="text-xl font-extrabold text-slate-900">Detail Pengukuran</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {selectedLog?.date} &bull; {selectedLog?.time}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Calibration Alert Box */}
            {selectedLog?.isCalibrating && (
              <div className="bg-sky-50 border border-sky-100 p-4 rounded-xl flex items-start gap-3">
                <div className="text-sky-600 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-sky-900">Mempelajari Pola Detak Jantung</h4>
                  <p className="text-sm text-sky-800 mt-0.5 leading-relaxed">
                    Nadiku sedang mengenali pola detak jantung normal Anda. Fitur peringatan dini akan aktif otomatis setelah pengukuran rutin selama 14 hari.
                  </p>
                </div>
              </div>
            )}

            {/* Warning Alert Box */}
            {!selectedLog?.isCalibrating && (selectedLog?.status === 'Perhatian' || selectedLog?.status === 'Waspada') && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-3">
                <div className="text-amber-600 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Perhatian: Pola Kurang Biasa</h4>
                  <p className="text-sm text-amber-800 mt-0.5 leading-relaxed">
                    {selectedLog.insight || 'Sistem mendeteksi fluktuasi yang perlu diperhatikan berdasarkan pola aktivitas Anda saat ini.'}
                  </p>
                </div>
              </div>
            )}

            {/* Video Player */}
            <div className="bg-stone-950 rounded-2xl overflow-hidden w-full h-[240px] sm:h-[320px] relative flex items-center justify-center shadow-inner">
              {selectedLog?.videoUrl ? (
                <video
                  src={selectedLog.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                />
              ) : (
                <span className="text-stone-500 text-sm">Video tidak tersedia</span>
              )}
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="bg-black/50 text-white backdrop-blur-md border-white/10 font-medium text-[10px]">
                  Rekaman rPPG
                </Badge>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-slate-500 leading-tight">Detak Jantung</span>
                <div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-extrabold text-slate-900 leading-none">{selectedLog?.hr}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">BPM</span>
                  </div>
                  {!selectedLog?.isCalibrating && selectedLog?.baselineHr && (
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                      Normal: {selectedLog.baselineHr} BPM
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-slate-500 leading-tight">Variabilitas<br/>(HRV)</span>
                <div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-extrabold text-slate-900 leading-none">{selectedLog?.hrv}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ms</span>
                  </div>
                  {!selectedLog?.isCalibrating && selectedLog?.baselineHrv && (
                    <p className="text-[10px] font-semibold text-slate-400 mt-1">
                      Normal: {selectedLog.baselineHrv} ms
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-slate-500 leading-tight">Respirasi</span>
                <div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-extrabold text-slate-900 leading-none">{selectedLog?.rr}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">bpm</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-slate-500 leading-tight">Kualitas<br/>Sinyal</span>
                <div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-extrabold text-slate-900 leading-none">{selectedLog?.quality}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Context / Note */}
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100/50 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-teal-900">Konteks Aktivitas</h4>
                <p className="text-sm text-teal-800/80 mt-1">{selectedLog?.note}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HistoryAndTrends
