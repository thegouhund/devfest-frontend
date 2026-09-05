import React, { useState } from 'react'
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

interface ActivityLogProps {
  activities: ActivityItem[]
  onAdd: (input: NewActivityInput) => void
  onDelete: (id: string) => void
}

const vitalResponse = (category: ActivityCategory) => {
  if (category === 'olahraga') return { text: '↗ Denyut naik (+14 BPM)', cls: 'text-rose-600 bg-rose-50 border-rose-100' }
  if (category === 'kopi') return { text: '↗ Stimulan (+6 BPM)', cls: 'text-amber-600 bg-amber-50 border-amber-100' }
  if (category === 'tidur') return { text: '↘ Pemulihan (62 BPM)', cls: 'text-teal-600 bg-teal-50 border-teal-100' }
  return { text: '✓ Denyut stabil (72 BPM)', cls: 'text-emerald-600 bg-emerald-50 border-emerald-100' }
}

export const ActivityLog: React.FC<ActivityLogProps> = ({ activities, onAdd, onDelete }) => {
  const [filter, setFilter] = useState<ActivityCategory | 'semua'>('semua')
  const [query, setQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
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

  const visible = activities.filter((a) => {
    const byCategory = filter === 'semua' || a.category === filter
    const q = query.toLowerCase()
    const bySearch = a.title.toLowerCase().includes(q) || a.detail.toLowerCase().includes(q)
    return byCategory && bySearch
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      category: newCategory,
      title: newTitle,
      detail: newDetail,
      date: newDate,
      time: newTime,
    })
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Aktivitas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold px-4 py-2 text-xs shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-300" />
            Tambah Aktivitas
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 items-start">
        {/* TABEL LOG AKTIVITAS */}
        <Card className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Log Aktivitas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Menampilkan {visible.length} dari {activities.length} catatan.
              </p>
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <Input
                type="text"
                placeholder="Cari aktivitas..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 rounded-full bg-white text-xs border-slate-200 shadow-2xs h-9"
              />
            </div>
          </div>

          {/* Filter kategori */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 mr-1">Filter:</span>
            <Button
              size="sm"
              variant={filter === 'semua' ? 'default' : 'outline'}
              onClick={() => setFilter('semua')}
              className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                filter === 'semua'
                  ? 'bg-slate-900 text-white font-bold shadow-xs hover:bg-slate-800'
                  : 'text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua
            </Button>
            {activityCategories.map((cat) => (
              <Button
                key={cat.key}
                size="sm"
                variant={filter === cat.key ? 'default' : 'outline'}
                onClick={() => setFilter(cat.key)}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  filter === cat.key
                    ? 'bg-slate-900 text-white font-bold shadow-xs hover:bg-slate-800'
                    : 'text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-slate-500 font-bold text-xs w-[130px]">Tanggal &amp; Waktu</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs min-w-[150px]">Aktivitas</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs">Kategori</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs min-w-[180px]">Keterangan / Detail</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs min-w-[170px]">Respon Vital Sign</TableHead>
                  <TableHead className="text-slate-500 font-bold text-xs text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-xs text-slate-400">
                      Tidak ada aktivitas yang cocok. Klik "Tambah Aktivitas" untuk mencatat.
                    </TableCell>
                  </TableRow>
                ) : (
                  visible.map((act) => {
                    const catInfo = activityCategories.find((c) => c.key === act.category)
                    const CatIcon = catInfo?.icon ?? Pin
                    const resp = vitalResponse(act.category)
                    return (
                      <TableRow key={act.id} className="border-slate-100 hover:bg-slate-50/60 transition-colors">
                        <TableCell className="text-xs font-semibold text-slate-700">
                          <span className="block">{formatDateID(act.date)}</span>
                          <span className="block font-mono text-[11px] text-slate-400">{act.time}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 shadow-2xs text-slate-600">
                              <CatIcon className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-bold text-xs text-slate-900">{act.title}</span>
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
                          <span className="text-xs text-slate-600 max-w-[220px] truncate block">
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
                            onClick={() => onDelete(act.id)}
                            aria-label={`Hapus ${act.title}`}
                            className="rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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
        </Card>

      </div>

      {/* POP UP: CATAT AKTIVITAS BARU */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-5">
          <DialogHeader className="flex flex-row items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                Catat Aktivitas Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Dipetakan otomatis ke grafik tren vital.
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kategori
              </Label>
              <div className="grid grid-cols-4 gap-1.5">
                {activityCategories.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setNewCategory(cat.key)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer ${
                      newCategory === cat.key
                        ? 'bg-indigo-50/60 border-indigo-500 text-indigo-800 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/30'
                    }`}
                  >
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="activityTitle" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                <Label htmlFor="activityDate" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
                <Label htmlFor="activityTime" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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
              <Label htmlFor="activityDetail" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
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

            <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="px-5 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="px-6 py-2 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-300" />
                Simpan Aktivitas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ActivityLog
