import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Search, Trash2, Pin } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { SortHeader, TablePagination, type SortOrder } from './TableControls'
import {
  activityCategories,
  formatDateID,
  labelFor,
  nowHHMM,
  todayISO,
  type ActivityCategory,
  type ActivityItem,
  type NewActivityInput,
} from '@/lib/activities'

type SortField = 'date' | 'title' | 'category'

interface ActivityLogProps {
  activities: ActivityItem[]
  onAdd: (input: NewActivityInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const vitalResponse = (category: ActivityCategory) => {
  if (category === 'olahraga') return { text: '↗ Denyut naik (+14 BPM)', cls: 'text-rose-600 bg-rose-50 border-rose-100' }
  if (category === 'kopi') return { text: '↗ Stimulan (+6 BPM)', cls: 'text-amber-600 bg-amber-50 border-amber-100' }
  if (category === 'tidur') return { text: '↘ Pemulihan (62 BPM)', cls: 'text-sage-600 bg-sage-50 border-sage-100' }
  return { text: '✓ Denyut stabil (72 BPM)', cls: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ activities, onAdd, onDelete }) => {
  const [filter, setFilter] = useState<ActivityCategory | 'semua'>('semua')
  const [query, setQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [newCategory, setNewCategory] = useState<ActivityCategory>('kopi')
  const [newTitle, setNewTitle] = useState('')
  const [newDetail, setNewDetail] = useState('')
  const [newDate, setNewDate] = useState(todayISO())
  const [newTime, setNewTime] = useState(nowHHMM())

  const openForm = () => {
    setNewCategory('kopi')
    setNewTitle('')
    setNewDetail('')
    setNewDate(todayISO())
    setNewTime(nowHHMM())
    setIsFormOpen(true)
  }

  const visible = useMemo(() => {
    const q = query.toLowerCase()
    const filtered = activities.filter((a) => {
      const byCategory = filter === 'semua' || a.category === filter
      const bySearch =
        a.title.toLowerCase().includes(q) ||
        a.detail.toLowerCase().includes(q) ||
        a.date.includes(q)
      return byCategory && bySearch
    })

    return [...filtered].sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') {
        cmp = a.date.localeCompare(b.date) || a.timestamp - b.timestamp
      } else if (sortField === 'title') {
        cmp = a.title.localeCompare(b.title)
      } else if (sortField === 'category') {
        cmp = labelFor(a.category).localeCompare(labelFor(b.category))
      }
      return sortOrder === 'asc' ? cmp : -cmp
    })
  }, [activities, filter, query, sortField, sortOrder])

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = visible.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setFormError(null)
    try {
      await onAdd({
        category: newCategory,
        title: newTitle,
        detail: newDetail,
        date: newDate,
        time: newTime,
      })
      setIsFormOpen(false)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Gagal menyimpan aktivitas')
    } finally {
      setIsSaving(false)
    }
  }

  const remove = async (id: string) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight">
            Aktivitas
          </h1>
          <p className="text-xs sm:text-sm text-ink-500 mt-0.5">
            Riwayat kebiasaan harian Anda dan korelasinya terhadap respon vital sign.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Chip size="sm" color="accent" variant="soft" className="font-semibold text-xs">
            {activities.length} Aktivitas Tercatat
          </Chip>
          <Button
            size="sm"
            onClick={openForm}
            className="bg-ink-900 hover:bg-ink-800 text-white rounded-full font-bold px-4 py-2 text-xs shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sage-300" />
            Tambah Aktivitas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 items-start">
        {/* TABEL LOG AKTIVITAS */}
        <Card className="rounded-2xl sm:rounded-3xl bg-white border border-ink-200/90 shadow-xs overflow-hidden p-0">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-100">
            <div>
              <h2 className="text-base font-bold text-ink-900 tracking-tight">Log Aktivitas</h2>
              <p className="text-xs text-ink-500 mt-0.5">
                Menampilkan {visible.length} dari {activities.length} catatan.
              </p>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-ink-400 absolute left-3 top-2.5 pointer-events-none" />
              <Input
                type="text"
                placeholder="Cari aktivitas..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 rounded-full bg-white text-xs border-ink-200 shadow-2xs h-9"
              />
            </div>
          </div>

          {/* Filter kategori */}
          <div className="px-5 sm:px-6 py-4 flex flex-wrap items-center gap-1.5 border-b border-ink-100">
            <span className="text-xs font-bold text-ink-500 mr-1">Filter:</span>
            <Button
              size="sm"
              variant={filter === 'semua' ? 'default' : 'outline'}
              onClick={() => {
                setFilter('semua')
                setCurrentPage(1)
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                filter === 'semua'
                  ? 'bg-ink-900 text-white font-bold shadow-xs hover:bg-ink-800'
                  : 'text-ink-600 border-ink-200 hover:bg-ink-100'
              }`}
            >
              Semua
            </Button>
            {activityCategories.map((cat) => (
              <Button
                key={cat.key}
                size="sm"
                variant={filter === cat.key ? 'default' : 'outline'}
                onClick={() => {
                  setFilter(cat.key)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  filter === cat.key
                    ? 'bg-ink-900 text-white font-bold shadow-xs hover:bg-ink-800'
                    : 'text-ink-600 border-ink-200 hover:bg-ink-100'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-ink-50/80 border-b border-ink-100">
                <TableRow className="hover:bg-transparent">
                  <SortHeader
                    field="date"
                    label="Tanggal & Waktu"
                    activeField={sortField}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                  <SortHeader
                    field="title"
                    label="Aktivitas"
                    activeField={sortField}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                  <SortHeader
                    field="category"
                    label="Kategori"
                    activeField={sortField}
                    order={sortOrder}
                    onSort={handleSort}
                  />
                  <TableHead className="px-5 py-3.5 text-xs font-bold text-ink-700 min-w-[180px]">
                    Keterangan / Detail
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-xs font-bold text-ink-700 min-w-[170px]">
                    Respon Vital Sign
                  </TableHead>
                  <TableHead className="px-5 py-3.5 text-right text-xs font-bold text-ink-700">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-5 py-12 text-center">
                      <span className="text-ink-500 font-medium text-sm">
                        {activities.length === 0
                          ? 'Belum ada aktivitas tercatat. Klik "Tambah Aktivitas" untuk mulai.'
                          : 'Tidak ada aktivitas yang cocok dengan filter saat ini.'}
                      </span>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((act) => {
                    const catInfo = activityCategories.find((c) => c.key === act.category)
                    const CatIcon = catInfo?.icon ?? Pin
                    const resp = vitalResponse(act.category)
                    return (
                      <TableRow key={act.id} className="border-ink-100 hover:bg-ink-50/60 transition-colors">
                        <TableCell className="text-xs font-semibold text-ink-700">
                          <span className="block">{formatDateID(act.date)}</span>
                          <span className="block font-mono text-[11px] text-ink-400">{act.time}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-ink-100 flex items-center justify-center shrink-0 shadow-2xs text-ink-600">
                              <CatIcon className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-bold text-xs text-ink-900">{act.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="soft"
                            color={
                              act.category === 'olahraga'
                                ? 'accent'
                                : act.category === 'kopi'
                                ? 'warning'
                                : act.category === 'makan'
                                ? 'success'
                                : 'neutral'
                            }
                            className="font-bold text-[10px] capitalize"
                          >
                            {catInfo?.label || act.category}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-ink-600 max-w-[220px] truncate block">
                            {act.detail}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${resp.cls}`}>
                            {resp.text}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void remove(act.id)}
                            disabled={deletingId === act.id}
                            aria-label={`Hapus ${act.title}`}
                            className="rounded-full text-ink-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <TablePagination
            page={safePage}
            pageSize={pageSize}
            total={visible.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </Card>

      </div>

      {/* POP UP: CATAT AKTIVITAS BARU */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-xl sm:max-w-xl bg-white rounded-3xl p-6 sm:p-7 border border-ink-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center gap-2.5 pb-3 border-b border-ink-100">
            <div className="w-10 h-10 rounded-xl bg-clay-50 border border-clay-100/80 flex items-center justify-center text-clay-600 shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-base font-bold text-ink-900 tracking-tight">
                Catat Aktivitas Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-500">
                Dipetakan otomatis ke grafik tren vital.
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-ink-700 uppercase tracking-wider">
                Kategori
              </Label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {activityCategories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setNewCategory(cat.key)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer ${
                      newCategory === cat.key
                        ? 'bg-clay-50/60 border-clay-500 text-clay-800 shadow-2xs'
                        : 'bg-white border-ink-200 text-ink-600 hover:border-clay-300 hover:bg-clay-50/30'
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activityTitle" className="text-xs font-bold text-ink-700 uppercase tracking-wider">
                Nama Aktivitas
              </Label>
              <Input
                id="activityTitle"
                type="text"
                required={newCategory === 'lainnya'}
                placeholder={
                  newCategory === 'lainnya'
                    ? 'misal: Meditasi sore'
                    : `Kosongkan untuk memakai "${labelFor(newCategory)}"`
                }
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="activityDate" className="text-xs font-bold text-ink-700 uppercase tracking-wider">
                  Tanggal
                </Label>
                <Input
                  id="activityDate"
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="activityTime" className="text-xs font-bold text-ink-700 uppercase tracking-wider">
                  Waktu
                </Label>
                <Input
                  id="activityTime"
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activityDetail" className="text-xs font-bold text-ink-700 uppercase tracking-wider">
                Keterangan
              </Label>
              <Input
                id="activityDetail"
                type="text"
                placeholder="misal: 1 cangkir espresso tanpa gula"
                value={newDetail}
                onChange={(e) => setNewDetail(e.target.value)}
                className="w-full text-xs"
              />
            </div>

            {formError && (
              <p className="text-xs text-red-600 font-medium">{formError}</p>
            )}

            <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-semibold text-ink-600 hover:bg-ink-100 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="px-6 py-2 rounded-full text-xs font-bold bg-ink-900 hover:bg-ink-800 text-white shadow-xs cursor-pointer disabled:opacity-70"
              >
                <Plus className="w-3.5 h-3.5 text-sage-300" />
                {isSaving ? 'Menyimpan…' : 'Simpan Aktivitas'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ActivityLog
