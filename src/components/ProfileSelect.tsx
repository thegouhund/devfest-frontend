import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Chip } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Lock, ChevronRight, AlertCircle, LogOut, Users, User } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { ageFrom, listProfiles, type Profile } from '@/lib/auth-api'
import { useAuth } from '../context/AuthContext'

export const ProfileSelect: React.FC = () => {
  const { selectProfile, logout } = useAuth()
  const [profiles, setProfiles] = useState<Profile[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)

  const [pinTarget, setPinTarget] = useState<Profile | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  useEffect(() => {
    listProfiles()
      .then((list) => setProfiles(list.filter((p) => p.is_active)))
      .catch((error: unknown) =>
        setLoadError(error instanceof ApiError ? error.message : 'Gagal memuat daftar profil')
      )
  }, [])

  const enter = async (profile: Profile, withPin?: string) => {
    setPending(profile.id)
    setPinError(null)
    try {
      await selectProfile(profile.id, withPin)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Gagal membuka profil'
      if (profile.has_pin) setPinError(message)
      else setLoadError(message)
    } finally {
      setPending(null)
    }
  }

  const pick = (profile: Profile) => {
    if (profile.has_pin) {
      setPin('')
      setPinError(null)
      setPinTarget(profile)
      return
    }
    void enter(profile)
  }

  return (
    <div className="min-h-screen bg-sand text-ink-900 flex flex-col justify-between p-4 sm:p-8 font-sans antialiased">
      <header className="max-w-lg w-full mx-auto flex items-center justify-between pb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-ink-200/80 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <img src="/logo.png" alt="Nadiku Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-ink-900 leading-tight">Nadiku</h1>
            <p className="text-xs font-medium text-ink-600">Pemantauan Kesehatan Keluarga</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-xs font-semibold text-ink-700 hover:text-ink-900 hover:bg-ink-100/60 rounded-full h-8 px-3.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Keluar
        </Button>
      </header>

      <main className="max-w-lg w-full mx-auto my-auto space-y-5">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">Siapa yang memakai?</h2>
          <p className="text-ink-600 text-sm">
            Pilih profil untuk melihat data kesehatannya. Anda bisa berganti profil kapan saja.
          </p>
        </div>

        <Card className="bg-white rounded-2xl sm:rounded-3xl border border-ink-200/90 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] p-4 sm:p-5">
          {loadError ? (
            <div className="py-10 text-center space-y-3">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-xs text-ink-600">{loadError}</p>
            </div>
          ) : !profiles ? (
            <div className="py-10 text-center text-xs text-ink-400">Memuat profil…</div>
          ) : profiles.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Users className="w-6 h-6 text-ink-400 mx-auto" />
              <p className="text-xs text-ink-600">Belum ada profil aktif di akun ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile) => {
                const age = ageFrom(profile.date_of_birth)
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => pick(profile)}
                    disabled={pending !== null}
                    className="w-full flex items-center gap-3.5 p-3 rounded-2xl border border-ink-200/80 bg-white hover:border-clay-400 hover:bg-clay-50/40 transition text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="w-11 h-11 rounded-full bg-ink-900 text-white flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-ink-900 truncate">{profile.full_name}</span>
                        {profile.role === 'admin' && (
                          <Chip size="sm" variant="soft" color="accent" className="font-bold text-[10px]">
                            Admin
                          </Chip>
                        )}
                        {profile.has_pin && <Lock className="w-3.5 h-3.5 text-ink-400 shrink-0" />}
                      </span>
                      <span className="block text-xs text-ink-500 mt-0.5 truncate">
                        {[profile.relationship_label, age !== null ? `${age} tahun` : null]
                          .filter(Boolean)
                          .join(' · ') || 'Profil keluarga'}
                      </span>
                    </span>

                    <ChevronRight className="w-4 h-4 text-ink-400 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </Card>
      </main>

      <Dialog open={pinTarget !== null} onOpenChange={(open) => !open && setPinTarget(null)}>
        <DialogContent className="w-full max-w-sm bg-white rounded-3xl p-6 border border-ink-200 shadow-2xl space-y-5">
          <DialogHeader className="flex flex-row items-center gap-2.5 pb-3 border-b border-ink-100">
            <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center text-ink-700 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-base font-bold text-ink-900 tracking-tight">
                Profil Terkunci
              </DialogTitle>
              <DialogDescription className="text-xs text-ink-500">
                Masukkan PIN untuk membuka {pinTarget?.full_name}.
              </DialogDescription>
            </div>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (pinTarget && pin) void enter(pinTarget, pin)
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="profilePin" className="text-xs font-bold text-ink-700 uppercase tracking-wider">
                PIN
              </Label>
              <Input
                id="profilePin"
                type="password"
                inputMode="numeric"
                autoFocus
                minLength={4}
                maxLength={12}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full h-11 text-center text-lg tracking-[0.4em] font-mono rounded-xl"
              />
              {pinError && (
                <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {pinError}
                </p>
              )}
            </div>

            <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setPinTarget(null)}
                className="px-5 py-2 rounded-full text-xs font-semibold text-ink-600 hover:bg-ink-100 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={pending !== null}
                className="px-6 py-2 rounded-full text-xs font-bold bg-ink-900 hover:bg-ink-800 text-white shadow-xs cursor-pointer"
              >
                {pending ? 'Membuka…' : 'Buka Profil'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <footer className="max-w-lg w-full mx-auto text-center pt-6 pb-2 text-xs font-medium text-ink-500">
        Nadiku &copy; 2026 &middot; Platform wellness non-diagnostik keluarga berbasis rPPG.
      </footer>
    </div>
  )
}

export default ProfileSelect
