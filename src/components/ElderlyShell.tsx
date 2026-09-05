import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HeartPulse, MessageCircle, LayoutGrid, LogOut } from 'lucide-react'
import { updateProfile } from '@/lib/auth-api'
import { useAuth } from '../context/AuthContext'
import RppgMeasure from './RppgMeasure'
import Copilot from './Copilot'

/**
 * Tampilan untuk `ui_mode: 'elderly'` — hanya dua hal yang bisa dilakukan:
 * mengukur (beserta hasilnya) dan bertanya ke asisten. Menu lain sengaja
 * tidak ada agar tidak ada yang perlu dicari.
 */
export const ElderlyShell: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { profile, refreshProfile } = useAuth()
  const [view, setView] = useState<'ukur' | 'tanya'>('ukur')
  const [switching, setSwitching] = useState(false)

  const backToStandard = async () => {
    if (!profile) return
    setSwitching(true)
    try {
      await updateProfile(profile.id, { ui_mode: 'standard' })
      await refreshProfile()
    } finally {
      setSwitching(false)
    }
  }

  const tabs = [
    { id: 'ukur' as const, label: 'Ukur Detak Jantung', icon: HeartPulse },
    { id: 'tanya' as const, label: 'Tanya Asisten', icon: MessageCircle },
  ]

  return (
    <div className="elderly-ui min-h-screen bg-sand text-ink-900 flex flex-col gap-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-white border border-ink-200/80 rounded-3xl px-5 py-4 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white border border-ink-200/80 p-1.5 flex items-center justify-center shadow-xs shrink-0">
            <img src="/logo.png" alt="Nadiku" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold tracking-tight truncate">
              Halo, {profile?.full_name?.split(' ')[0] ?? 'Anda'}
            </p>
            <p className="text-base text-ink-500">Nadiku · Pemantauan Kesehatan</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void backToStandard()}
            disabled={switching}
            className="h-12 px-4 rounded-2xl text-base font-bold border-ink-300 text-ink-700 hover:bg-ink-100 cursor-pointer flex items-center gap-2"
          >
            <LayoutGrid className="w-5 h-5" />
            {switching ? 'Mengubah…' : 'Tampilan Lengkap'}
          </Button>

          {onLogout && (
            <Button
              variant="outline"
              onClick={onLogout}
              className="h-12 px-4 rounded-2xl text-base font-bold border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Keluar
            </Button>
          )}
        </div>
      </header>

      {/* Dua tombol besar, tanpa menu tersembunyi */}
      <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            aria-pressed={view === tab.id}
            className={`flex items-center justify-center gap-3 min-h-20 rounded-3xl border-2 text-xl font-extrabold transition cursor-pointer ${
              view === tab.id
                ? 'bg-ink-900 text-white border-ink-900 shadow-md'
                : 'bg-white text-ink-700 border-ink-200 hover:border-ink-400'
            }`}
          >
            <tab.icon className="w-7 h-7" />
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 flex flex-col min-h-0">
        {view === 'ukur' ? <RppgMeasure /> : <Copilot />}
      </main>

      <footer className="text-center text-base text-ink-500 pb-2">
        Hasil pengukuran bersifat informasional, bukan diagnosis medis.
      </footer>
    </div>
  )
}

export default ElderlyShell
