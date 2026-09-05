import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { UserProfile } from './Dashboard'

interface HistoryAndTrendsProps {
  member: UserProfile
}

// Mock historical data including video link and RR (respiration rate)
const historyLogs = [
  { id: 1, date: '5 Sep 2026', time: '08:30 WIB', hr: 72, hrv: 52, rr: 16, status: 'Normal', quality: 98, note: 'Pagi hari', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 2, date: '4 Sep 2026', time: '19:45 WIB', hr: 78, hrv: 46, rr: 18, status: 'Normal', quality: 95, note: 'Setelah makan malam', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 3, date: '4 Sep 2026', time: '07:15 WIB', hr: 69, hrv: 54, rr: 15, status: 'Normal', quality: 97, note: 'Bangun tidur', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 4, date: '3 Sep 2026', time: '14:20 WIB', hr: 85, hrv: 40, rr: 20, status: 'Waspada', quality: 92, note: 'Setelah kopi', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
  { id: 5, date: '3 Sep 2026', time: '08:00 WIB', hr: 71, hrv: 53, rr: 15, status: 'Normal', quality: 99, note: 'Pagi hari', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4' },
]

export const HistoryAndTrends: React.FC<HistoryAndTrendsProps> = ({ member }) => {
  const [selectedLog, setSelectedLog] = useState<typeof historyLogs[0] | null>(null)
  const [period, setPeriod] = useState<'7 Hari' | '14 Hari' | '30 Hari'>('7 Hari')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = historyLogs.filter((log) => {
    const q = searchQuery.toLowerCase()
    return (
      log.note.toLowerCase().includes(q) ||
      log.status.toLowerCase().includes(q) ||
      log.date.toLowerCase().includes(q) ||
      log.time.toLowerCase().includes(q) ||
      log.hr.toString().includes(q)
    )
  })

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Riwayat & Tren BPM</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Log riwayat pengukuran vital sign untuk {member.name}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-full text-xs">
          {['7 Hari', '14 Hari', '30 Hari'].map((p) => (
            <Button
              key={p}
              size="sm"
              variant={period === p ? 'default' : 'ghost'}
              onClick={() => setPeriod(p as any)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold h-auto ${
                period === p ? 'bg-white text-slate-900 shadow-xs hover:bg-white/90' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* History Log Table */}
      <Card className="rounded-3xl bg-white border border-stone-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Log Riwayat Pengukuran</h3>
            <p className="text-xs text-slate-500 mt-0.5">Klik pada baris untuk melihat detail & video</p>
          </div>
          <div className="w-full sm:w-72 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari catatan, tanggal, atau BPM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 hover:bg-stone-100 rounded-xl text-sm placeholder:text-slate-400 font-medium focus:outline-hidden focus:border-teal-700 focus:ring-1 focus:ring-teal-700 transition-colors shadow-xs"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-100">
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Waktu</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Kondisi / Catatan</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">BPM</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">HRV</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Kualitas</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-teal-50/50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-slate-900">{log.date}</div>
                      <div className="text-xs text-slate-500 font-medium">{log.time}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-700">{log.note}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-extrabold text-slate-900">{log.hr}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-slate-700">{log.hrv} <span className="text-xs text-slate-400 font-normal">ms</span></span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-slate-600 font-medium">{log.quality}%</span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge 
                        variant="outline" 
                        className={`font-bold text-[10px] uppercase shadow-xs pointer-events-none border-0 ${
                          log.status === 'Waspada' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs font-bold h-8 text-teal-700 border-teal-200 bg-teal-50 hover:bg-teal-100 hover:text-teal-800 group-hover:border-teal-300"
                        onClick={(e) => {
                          e.stopPropagation() // prevent double firing if row is also clicked
                          setSelectedLog(log)
                        }}
                      >
                        Detail
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <span className="text-slate-500 font-medium text-sm">Tidak ada riwayat yang cocok dengan pencarian "{searchQuery}"</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="p-4 sm:p-5 border-t border-stone-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500 bg-stone-50/50">
          <div>
            Menampilkan 1-{filteredLogs.length} dari {filteredLogs.length} data
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span>Tampilkan</span>
              <select className="border border-stone-200 rounded-lg px-2 py-1 text-slate-700 bg-white outline-hidden focus:border-teal-700 focus:ring-1 focus:ring-teal-700">
                <option>5</option>
                <option>10</option>
                <option>20</option>
              </select>
              <span>per halaman</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-md bg-white border-stone-200 text-stone-400" disabled>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-md bg-white border-stone-200 text-stone-400" disabled>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </Button>
              <div className="px-3 text-slate-700 font-medium">Page 1 of 1</div>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-md bg-white border-stone-200 text-stone-400" disabled>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-md bg-white border-stone-200 text-stone-400" disabled>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open: boolean) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl sm:max-w-2xl md:max-w-3xl bg-white rounded-3xl p-6 sm:p-8 space-y-6 border border-stone-200 shadow-xl overflow-hidden">
          <DialogHeader className="pb-3 border-b border-stone-100 pr-8">
            <DialogTitle className="text-xl font-extrabold text-slate-900">Detail Pengukuran</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {selectedLog?.date} &bull; {selectedLog?.time}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
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
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 leading-none">{selectedLog?.hr}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">BPM</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-slate-500 leading-tight">Variabilitas<br/>(HRV)</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 leading-none">{selectedLog?.hrv}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">ms</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-slate-500 leading-tight">Respirasi</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 leading-none">{selectedLog?.rr}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">bpm</span>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-100 flex flex-col justify-between min-h-[96px]">
                <span className="text-xs font-bold text-slate-500 leading-tight">Kualitas<br/>Sinyal</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-2xl font-extrabold text-slate-900 leading-none">{selectedLog?.quality}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">%</span>
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
