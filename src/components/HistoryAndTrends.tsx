import React, { useState, useMemo, useEffect, useCallback } from 'react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'
import {
  Search,
  Calendar as CalendarIcon,
  X,
  RotateCcw,
  Video,
} from 'lucide-react'
import type { UserProfile } from './Dashboard'
import { ApiError } from '@/lib/api'
import { SortHeader, TablePagination } from './TableControls'
import { fromApiCategory, labelFor } from '@/lib/activities'
import {
  getAnomaly,
  getMeasurementResults,
  getVitalsSummary,
  listAnomalies,
  listMeasurements,
  type Anomaly,
  type AnomalyDetail,
  type Reading,
} from '@/lib/health-api'

interface HistoryAndTrendsProps {
  member: UserProfile
  onNavigateToRppg?: () => void
}

export interface VitalHistoryItem {
  id: string
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
  /** Backend tidak menyimpan video, jadi ini selalu kosong untuk data asli. */
  videoUrl?: string
  isCalibrating?: boolean
  baselineHr?: number
  baselineHrv?: number
  insight?: string
  /** Aktivitas berdekatan waktunya, dari detail anomali. */
  relatedActivity?: string
}

type SortField = 'date' | 'note' | 'hr' | 'hrv' | 'rr' | 'quality' | 'status'

/** Riwayat diambil sebanyak ini; backend tidak punya filter tanggal di
 *  /measurements, jadi penyaringan periode dilakukan di klien. */
const HISTORY_LIMIT = 50

const readingValue = (readings: Reading[], metric: string) =>
  Math.round(readings.find((r) => r.metric_type === metric)?.value ?? 0)

const statusFromAnomalies = (list: Anomaly[]): VitalHistoryItem['status'] => {
  if (list.some((a) => a.severity === 'high')) return 'Waspada'
  if (list.length > 0) return 'Perhatian'
  return 'Normal'
}

const insightFromAnomalies = (list: Anomaly[]) => {
  if (list.length === 0) return undefined
  const worst =
    list.find((a) => a.severity === 'high') ?? list.find((a) => a.severity === 'medium') ?? list[0]
  const label = worst.metric_type.replace(/_/g, ' ')
  const direction = worst.observed_value >= worst.baseline_mean ? 'di atas' : 'di bawah'
  return `Nilai ${label} ${Math.round(worst.observed_value)} berada ${direction} baseline Anda (${Math.round(
    worst.baseline_mean
  )}), simpangan ${worst.deviation_score.toFixed(1)}σ.`
}

export const HistoryAndTrends: React.FC<HistoryAndTrendsProps> = ({
  member,
  onNavigateToRppg,
}) => {
  const [historyLogs, setHistoryLogs] = useState<VitalHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedLog, setSelectedLog] = useState<VitalHistoryItem | null>(null)
  const [period, setPeriod] = useState<'7 Hari' | '14 Hari' | '30 Hari'>('7 Hari')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const memberId = member.id || undefined

  const reload = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const now = new Date()
      const from = new Date()
      from.setDate(now.getDate() - 90)
      // Dibatasi ke profil aktif: sebagian endpoint mengembalikan data seluruh
      // profil yang boleh dilihat kalau family_member_id dikosongkan.
      const range = {
        start: from.toISOString(),
        end: now.toISOString(),
        family_member_id: memberId,
      }

      const [sessionList, summary, anomalyList] = await Promise.all([
        listMeasurements(HISTORY_LIMIT, memberId),
        getVitalsSummary(range),
        listAnomalies({ limit: 50, family_member_id: memberId }),
      ])

      // Daftar anomali tidak memuat id sesi; hanya detailnya yang punya.
      const details = await Promise.all(
        anomalyList.anomalies.map((a) => getAnomaly(a.id).catch(() => null))
      )
      const anomaliesBySession = new Map<string, AnomalyDetail[]>()
      for (const detail of details) {
        if (!detail?.measurement_session_id) continue
        const bucket: AnomalyDetail[] = anomaliesBySession.get(detail.measurement_session_id) ?? []
        bucket.push(detail)
        anomaliesBySession.set(detail.measurement_session_id, bucket)
      }

      const completed = sessionList.sessions.filter((s) => s.processing_status === 'completed')
      const results = await Promise.all(
        completed.map((s) => getMeasurementResults(s.id).catch(() => null))
      )

      const hrBaseline = summary.metrics.find((m) => m.metric_type === 'heart_rate')?.baseline
      const hrvBaseline = summary.metrics.find((m) => m.metric_type === 'hrv_rmssd')?.baseline
      // baseline.is_active=false berarti sistem masih mengumpulkan data (≥14 hari).
      const calibrating = !hrBaseline?.is_active

      const logs: VitalHistoryItem[] = completed.flatMap((session, i) => {
        const result = results[i]
        if (!result) return []
        const when = new Date(result.recorded_at ?? session.started_at ?? Date.now())
        const sessionAnomalies = anomaliesBySession.get(session.id) ?? []
        const related = sessionAnomalies.find((a) => a.related_activity)?.related_activity

        return [
          {
            id: session.id,
            timestamp: when.getTime(),
            daysAgo: Math.floor((Date.now() - when.getTime()) / 86_400_000),
            date: when.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            time: `${when.toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
            })} WIB`,
            hr: readingValue(result.readings, 'heart_rate'),
            hrv: readingValue(result.readings, 'hrv_rmssd'),
            rr: readingValue(result.readings, 'respiration_rate'),
            status: calibrating ? 'Normal' : statusFromAnomalies(sessionAnomalies),
            quality: Math.round((result.signal_quality_score ?? 0) * 100),
            note: session.capture_method === 'upload' ? 'Unggah video' : 'Rekaman langsung',
            isCalibrating: calibrating,
            baselineHr: hrBaseline?.is_active ? Math.round(hrBaseline.mean) : undefined,
            baselineHrv: hrvBaseline?.is_active ? Math.round(hrvBaseline.mean) : undefined,
            insight: calibrating ? undefined : insightFromAnomalies(sessionAnomalies),
            relatedActivity: related
              ? `${labelFor(fromApiCategory(related.category))}${
                  related.quantity ? ` ×${related.quantity}` : ''
                } · ${new Date(related.occurred_at).toLocaleString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : undefined,
          },
        ]
      })

      setHistoryLogs(logs)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Gagal memuat riwayat pengukuran')
    } finally {
      setIsLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    void reload()
  }, [reload])

  // Format label for date range button
  const formatDateRangeLabel = (range: DateRange | undefined): string => {
    if (!range?.from) return 'Pilih Rentang Tanggal'
    const fromStr = range.from.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    if (!range.to || range.from.getTime() === range.to.getTime()) {
      return fromStr
    }
    const toStr = range.to.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${fromStr} - ${toStr}`
  }

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)

  // Filter logs by calendar dateRange or period preset, and search query
  const filteredLogs = useMemo(() => {
    return historyLogs.filter((log) => {
      // 1. Calendar date range filter (takes precedence if set)
      if (dateRange?.from) {
        const start = new Date(dateRange.from)
        start.setHours(0, 0, 0, 0)
        const end = new Date(dateRange.to || dateRange.from)
        end.setHours(23, 59, 59, 999)

        if (log.timestamp < start.getTime() || log.timestamp > end.getTime()) {
          return false
        }
      } else {
        // 2. Preset period filter
        if (period === '7 Hari' && log.daysAgo > 7) return false
        if (period === '14 Hari' && log.daysAgo > 14) return false
        if (period === '30 Hari' && log.daysAgo > 30) return false
      }

      // 3. Search query filter
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
  }, [historyLogs, dateRange, period, searchQuery])

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

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-ink-900 tracking-tight">Riwayat BPM</h2>
          <p className="text-xs sm:text-sm text-ink-500 mt-1">
            Log riwayat pengukuran vital sign untuk {member.name}
          </p>
        </div>

        {/* Filter Controls: Quick Presets + Popup Range Calendar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-1 bg-ink-100 p-1 rounded-full text-xs shrink-0">
            {(['7 Hari', '14 Hari', '30 Hari'] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={!dateRange && period === p ? 'default' : 'ghost'}
                onClick={() => {
                  setDateRange(undefined)
                  setPeriod(p)
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold h-auto transition-all cursor-pointer ${
                  !dateRange && period === p
                    ? 'bg-white text-ink-900 shadow-xs hover:bg-white/90 font-bold'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                {p}
              </Button>
            ))}
          </div>

          {/* POPUP RANGE CALENDAR BUTTON */}
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={dateRange?.from ? 'default' : 'outline'}
                size="sm"
                className={`h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-2 border transition shadow-2xs cursor-pointer min-w-0 ${
                  dateRange?.from
                    ? 'bg-ink-900 text-white hover:bg-ink-800 hover:text-white active:text-white aria-expanded:text-white aria-expanded:bg-ink-800 border-ink-900 font-bold'
                    : 'bg-white border-ink-200 text-ink-700 hover:bg-ink-50 hover:text-ink-900'
                }`}
              >
                <CalendarIcon className={`w-3.5 h-3.5 ${dateRange?.from ? 'text-sage-300' : 'text-ink-500'}`} />
                <span className={`truncate ${dateRange?.from ? 'text-white hover:text-white' : ''}`}>
                  {formatDateRangeLabel(dateRange)}
                </span>
                {dateRange?.from && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      setDateRange(undefined)
                      setPeriod('7 Hari')
                      setCurrentPage(1)
                    }}
                    className="p-0.5 rounded-full hover:bg-white/20 text-white hover:text-white cursor-pointer ml-0.5 inline-flex items-center justify-center"
                    title="Hapus filter kalender"
                  >
                    <X className="w-3 h-3 text-white" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-4 bg-white rounded-3xl shadow-2xl border border-ink-200 space-y-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-ink-100">
                <div>
                  <h4 className="text-xs font-bold text-ink-900">Pilih Rentang Tanggal</h4>
                  <p className="text-[11px] text-ink-500">Filter data riwayat BPM berdasarkan kalender</p>
                </div>
                {dateRange?.from && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateRange(undefined)
                      setPeriod('7 Hari')
                      setCurrentPage(1)
                    }}
                    className="text-[11px] h-7 px-2 text-ink-500 hover:text-ink-900 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Button>
                )}
              </div>

              <div className="flex justify-center bg-ink-50/50 p-2 rounded-2xl border border-ink-100">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from ?? new Date()}
                  selected={dateRange}
                  onSelect={(range) => {
                    setDateRange(range)
                    setCurrentPage(1)
                  }}
                  numberOfMonths={1}
                  className="p-1"
                />
              </div>

              <div className="pt-2 border-t border-ink-100 flex items-center justify-between gap-3 text-xs">
                <span className="text-[11px] font-medium text-ink-600 truncate max-w-[190px]">
                  {formatDateRangeLabel(dateRange)}
                </span>
                <Button
                  size="sm"
                  onClick={() => setIsCalendarOpen(false)}
                  className="h-7 px-4 text-xs bg-ink-900 text-white rounded-full font-bold hover:bg-ink-800 cursor-pointer shadow-xs"
                >
                  Terapkan
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* CTA UKUR rPPG (DI KANAN PILIH RENTANG TANGGAL) */}
          <Button
            size="sm"
            onClick={onNavigateToRppg}
            className="h-9 px-4 rounded-full text-xs font-bold bg-ink-900 text-white hover:bg-ink-800 shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition w-full sm:w-auto sm:shrink-0"
          >
            <Video className="w-3.5 h-3.5 text-clay-400" />
            Ukur rPPG
          </Button>
        </div>
      </div>

      {/* History Log Data Table Card */}
      <Card className="rounded-3xl bg-white border border-ink-200/90 shadow-xs overflow-hidden">
        {/* Table Toolbar Header */}
        <div className="p-5 sm:p-6 border-b border-ink-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-ink-900">Log Riwayat Pengukuran</h3>
              <Badge variant="outline" className="text-[11px] font-bold text-ink-600 bg-ink-100/70 border-ink-200">
                {filteredLogs.length} Catatan
              </Badge>
              {dateRange?.from && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-sepia-100/70 text-sepia-900 border border-sepia-200 font-medium">
                  <CalendarIcon className="w-3 h-3 text-sepia-700" />
                  {formatDateRangeLabel(dateRange)}
                  <button
                    type="button"
                    onClick={() => {
                      setDateRange(undefined)
                      setPeriod('7 Hari')
                      setCurrentPage(1)
                    }}
                    className="hover:text-sepia-950 ml-0.5 cursor-pointer"
                    title="Reset rentang kalender"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <p className="text-xs text-ink-500">Klik pada baris untuk melihat rekaman video & detail lengkap</p>
          </div>
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Cari catatan, tanggal, status, atau BPM..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-3 h-9 bg-ink-50 border-ink-200 hover:bg-ink-100 rounded-xl text-sm placeholder:text-ink-400 font-medium focus-visible:border-sepia-700 focus-visible:ring-sepia-700/30 transition-colors shadow-xs"
            />
          </div>
        </div>

        {/* Shadcn Table */}
        <Table>
          <TableHeader className="bg-ink-50/80 border-b border-ink-100">
            <TableRow className="hover:bg-transparent">
              <SortHeader
                field="date"
                label="Waktu"
                activeField={sortField}
                order={sortOrder}
                onSort={handleSort}
              />
              <SortHeader
                field="note"
                label="Kondisi / Catatan"
                activeField={sortField}
                order={sortOrder}
                onSort={handleSort}
              />
              <SortHeader
                field="hr"
                label="BPM"
                activeField={sortField}
                order={sortOrder}
                onSort={handleSort}
              />
              <SortHeader
                field="hrv"
                label="HRV"
                activeField={sortField}
                order={sortOrder}
                onSort={handleSort}
              />
              <SortHeader
                field="rr"
                label="Respirasi"
                activeField={sortField}
                order={sortOrder}
                onSort={handleSort}
              />
              <SortHeader
                field="quality"
                label="Kualitas"
                activeField={sortField}
                order={sortOrder}
                onSort={handleSort}
              />
              <SortHeader
                field="status"
                label="Status"
                activeField={sortField}
                order={sortOrder}
                onSort={handleSort}
              />
              <TableHead className="px-5 py-3.5 text-right text-xs font-bold text-ink-700">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-ink-100">
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <TableRow
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-sepia-50/40 transition-colors cursor-pointer group"
                >
                  <TableCell className="px-5 py-4">
                    <div className="text-sm font-bold text-ink-900">{log.date}</div>
                    <div className="text-xs text-ink-500 font-medium">{log.time}</div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-sm text-ink-700">{log.note}</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-ink-900">{log.hr}</span>
                      {!log.isCalibrating && log.baselineHr && (
                        <span
                          className={`text-[10px] font-bold ${
                            log.hr > log.baselineHr ? 'text-rose-500' : 'text-sepia-600'
                          }`}
                        >
                          {log.hr > log.baselineHr ? '↑' : '↓'} {Math.abs(log.hr - log.baselineHr)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-ink-700">
                        {log.hrv} <span className="text-xs text-ink-400 font-normal">ms</span>
                      </span>
                      {!log.isCalibrating && log.baselineHrv && (
                        <span
                          className={`text-[10px] font-bold ${
                            log.hrv > log.baselineHrv ? 'text-sepia-600' : 'text-amber-500'
                          }`}
                        >
                          {log.hrv > log.baselineHrv ? '↑' : '↓'} {Math.abs(log.hrv - log.baselineHrv)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-sm font-bold text-ink-700">
                      {log.rr} <span className="text-xs text-ink-400 font-normal">bpm</span>
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span className="text-sm text-ink-600 font-medium">{log.quality}%</span>
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <Badge
                      variant="outline"
                      className={`font-bold text-[10px] uppercase shadow-xs pointer-events-none border-0 ${
                        log.isCalibrating
                          ? 'bg-sepia-100 text-sepia-800'
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
                      className="text-xs font-bold h-8 text-sepia-700 border-sepia-200 bg-sepia-50 hover:bg-sepia-100 hover:text-sepia-800 group-hover:border-sepia-300"
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
                  {isLoading ? (
                    <span className="text-ink-400 font-medium text-sm">Memuat riwayat…</span>
                  ) : loadError ? (
                    <div className="space-y-3">
                      <span className="text-amber-700 font-medium text-sm block">{loadError}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void reload()}
                        className="rounded-full text-xs font-semibold cursor-pointer"
                      >
                        Coba lagi
                      </Button>
                    </div>
                  ) : historyLogs.length === 0 ? (
                    <span className="text-ink-500 font-medium text-sm">
                      Belum ada pengukuran yang selesai diproses.
                    </span>
                  ) : (
                    <span className="text-ink-500 font-medium text-sm">
                      Tidak ada riwayat yang cocok dengan filter saat ini
                      {searchQuery ? ` ("${searchQuery}")` : ''}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          page={safeCurrentPage}
          pageSize={pageSize}
          total={totalItems}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size)
            setCurrentPage(1)
          }}
        />
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open: boolean) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-ink-200 shadow-xl">
          <DialogHeader className="pb-3 border-b border-ink-100 pr-8">
            <DialogTitle className="text-xl font-extrabold text-ink-900">Detail Pengukuran</DialogTitle>
            <DialogDescription className="text-sm text-ink-500">
              {selectedLog?.date} &bull; {selectedLog?.time}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Calibration Alert Box */}
            {selectedLog?.isCalibrating && (
              <div className="bg-sepia-50 border border-sepia-100 p-4 rounded-xl flex items-start gap-3">
                <div className="text-sepia-600 shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-sepia-900">Mempelajari Pola Detak Jantung</h4>
                  <p className="text-sm text-sepia-800 mt-0.5 leading-relaxed">
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
            <div className="bg-ink-950 rounded-2xl overflow-hidden w-full h-[240px] sm:h-[320px] relative flex items-center justify-center shadow-inner">
              {selectedLog?.videoUrl ? (
                <video
                  src={selectedLog.videoUrl}
                  controls
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                />
              ) : (
                <span className="text-ink-500 text-sm">Video tidak tersedia</span>
              )}
              <div className="absolute top-3 right-3">
                <Badge variant="outline" className="bg-black/50 text-white backdrop-blur-md border-white/10 font-medium text-[10px]">
                  Rekaman rPPG
                </Badge>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-ink-50 border border-ink-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-ink-500 leading-tight">Detak Jantung</span>
                <div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-extrabold text-ink-900 leading-none">{selectedLog?.hr}</span>
                    <span className="text-[10px] font-bold text-ink-400 uppercase">BPM</span>
                  </div>
                  {!selectedLog?.isCalibrating && selectedLog?.baselineHr && (
                    <p className="text-[10px] font-semibold text-ink-400 mt-1">
                      Normal: {selectedLog.baselineHr} BPM
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-ink-50 border border-ink-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-ink-500 leading-tight">Variabilitas<br/>(HRV)</span>
                <div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-extrabold text-ink-900 leading-none">{selectedLog?.hrv}</span>
                    <span className="text-[10px] font-bold text-ink-400 uppercase">ms</span>
                  </div>
                  {!selectedLog?.isCalibrating && selectedLog?.baselineHrv && (
                    <p className="text-[10px] font-semibold text-ink-400 mt-1">
                      Normal: {selectedLog.baselineHrv} ms
                    </p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-ink-50 border border-ink-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-ink-500 leading-tight">Respirasi</span>
                <div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-extrabold text-ink-900 leading-none">{selectedLog?.rr}</span>
                    <span className="text-[10px] font-bold text-ink-400 uppercase">bpm</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-ink-50 border border-ink-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-ink-500 leading-tight">Kualitas<br/>Sinyal</span>
                <div>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-extrabold text-ink-900 leading-none">{selectedLog?.quality}</span>
                    <span className="text-[10px] font-bold text-ink-400 uppercase">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Context / Note */}
            <div className="p-4 rounded-2xl bg-sepia-50/50 border border-sepia-100/50 flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-sepia-100 text-sepia-800 flex items-center justify-center shrink-0 shadow-xs">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-sepia-900">Konteks Aktivitas</h4>
                <p className="text-sm text-sepia-800/80 mt-1">
                  {selectedLog?.relatedActivity ??
                    'Tidak ada aktivitas tercatat berdekatan dengan waktu pengukuran ini.'}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default HistoryAndTrends
