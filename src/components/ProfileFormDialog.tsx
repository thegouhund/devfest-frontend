import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Accessibility,
  Calendar,
  KeyRound,
  Mail,
  Phone,
  Ruler,
  Scale,
  UserPen,
  UserPlus,
} from 'lucide-react'
import { ApiError } from '@/lib/api'

export interface ProfileFormValues {
  fullName: string
  relation: string
  dateOfBirth: string
  gender: 'Laki-laki' | 'Perempuan'
  height: string
  weight: string
  /** Hanya terisi pada mode 'create'; PATCH /profiles tidak menerima PIN. */
  pin: string
  /** Hanya terisi kalau bagian akun ditampilkan. */
  phone: string
  uiMode: 'standard' | 'elderly'
}

const EMPTY: ProfileFormValues = {
  fullName: '',
  relation: 'Anak',
  dateOfBirth: '',
  gender: 'Laki-laki',
  height: '',
  weight: '',
  pin: '',
  phone: '',
  uiMode: 'standard',
}

const RELATIONS = ['Anak', 'Ayah', 'Ibu', 'Kakek', 'Nenek', 'Saudara', 'Pasangan', 'Lainnya']

interface ProfileFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  initial?: Partial<ProfileFormValues>
  /** Email akun; kalau diisi, bagian "Akun" ikut tampil (profil sendiri). */
  accountEmail?: string | null
  onSubmit: (values: ProfileFormValues) => Promise<void>
}

export const ProfileFormDialog: React.FC<ProfileFormDialogProps> = ({
  open,
  onOpenChange,
  mode,
  initial,
  accountEmail,
  onSubmit,
}) => {
  const [values, setValues] = useState<ProfileFormValues>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form diisi ulang tiap dialog dibuka, supaya tidak membawa sisa data
  // profil yang diedit sebelumnya.
  useEffect(() => {
    if (!open) return
    setValues({ ...EMPTY, ...initial })
    setError(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }))

  const age = useMemo(() => {
    if (!values.dateOfBirth) return null
    const born = new Date(values.dateOfBirth)
    if (Number.isNaN(born.getTime())) return null
    const now = new Date()
    let years = now.getFullYear() - born.getFullYear()
    const m = now.getMonth() - born.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < born.getDate())) years--
    return years >= 0 ? years : null
  }, [values.dateOfBirth])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!values.fullName.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan profil')
    } finally {
      setIsSaving(false)
    }
  }

  const isCreate = mode === 'create'
  const fieldClass =
    'text-xs bg-white border-ink-200 rounded-xl px-3 py-2 text-ink-800 focus-visible:ring-sage-700/20'
  const selectClass =
    'w-full h-9 text-xs bg-white border border-ink-200 rounded-xl px-3 py-1.5 text-ink-800 focus:outline-none focus:ring-2 focus:ring-sage-700/20 focus:border-sage-700 transition cursor-pointer'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-ink-200 sm:max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-full bg-sage-100 text-sage-800">
              {isCreate ? <UserPlus className="w-4 h-4" /> : <UserPen className="w-4 h-4" />}
            </span>
            <DialogTitle className="text-lg font-bold text-ink-900">
              {isCreate ? 'Tambah Anggota Keluarga' : 'Edit Profil'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-ink-500">
            {isCreate
              ? 'Daftarkan profil baru untuk pemantauan rPPG dan konteks analisis Copilot.'
              : 'Perbarui data profil. Tinggi dan berat dipakai sebagai konteks analisis.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 pt-2">
          <div className="space-y-4">
            {/* IDENTITAS */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="profileName" className="text-xs font-bold text-ink-700">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="profileName"
                  type="text"
                  required
                  placeholder="Contoh: Farhan Pratama"
                  value={values.fullName}
                  onChange={(e) => set('fullName', e.target.value)}
                  className="text-xs bg-ink-50/80 border-ink-200 rounded-xl px-3 py-2 text-ink-800 focus-visible:ring-sage-700/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profileRelation" className="text-xs font-bold text-ink-700">
                  Hubungan Keluarga
                </Label>
                <select
                  id="profileRelation"
                  value={values.relation}
                  onChange={(e) => set('relation', e.target.value)}
                  className={`${selectClass} bg-ink-50/80`}
                >
                  {RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* DEMOGRAFIS & FISIK */}
            <div className="p-3.5 rounded-2xl bg-ink-50/60 border border-ink-200/80 space-y-3">
              <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sage-700" />
                Data Demografis & Fisik
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="profileDob" className="text-xs font-semibold text-ink-700">
                      Tanggal Lahir
                    </Label>
                    {age !== null && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800">
                        {age} tahun
                      </span>
                    )}
                  </div>
                  <Input
                    id="profileDob"
                    type="date"
                    value={values.dateOfBirth}
                    onChange={(e) => set('dateOfBirth', e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="profileGender" className="text-xs font-semibold text-ink-700">
                    Jenis Kelamin
                  </Label>
                  <select
                    id="profileGender"
                    value={values.gender}
                    onChange={(e) => set('gender', e.target.value as ProfileFormValues['gender'])}
                    className={selectClass}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="profileHeight"
                    className="text-xs font-semibold text-ink-700 flex items-center gap-1"
                  >
                    <Ruler className="w-3.5 h-3.5 text-ink-400" />
                    Tinggi Badan (cm)
                  </Label>
                  <Input
                    id="profileHeight"
                    type="number"
                    min="30"
                    max="250"
                    step="0.1"
                    placeholder="Contoh: 165"
                    value={values.height}
                    onChange={(e) => set('height', e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="profileWeight"
                    className="text-xs font-semibold text-ink-700 flex items-center gap-1"
                  >
                    <Scale className="w-3.5 h-3.5 text-ink-400" />
                    Berat Badan (kg)
                  </Label>
                  <Input
                    id="profileWeight"
                    type="number"
                    min="2"
                    max="300"
                    step="0.1"
                    placeholder="Contoh: 58"
                    value={values.weight}
                    onChange={(e) => set('weight', e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            </div>

            {/* TAMPILAN — ui_mode dikirim ke PATCH/POST /profiles */}
            <div className="p-3.5 rounded-2xl bg-ink-50/60 border border-ink-200/80 space-y-2.5">
              <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                <Accessibility className="w-3.5 h-3.5 text-sage-700" />
                Mode Tampilan
              </span>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: 'standard', label: 'Standar', desc: 'Semua menu & grafik' },
                    { key: 'elderly', label: 'Lansia', desc: 'Teks besar, 2 menu saja' },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => set('uiMode', option.key)}
                    aria-pressed={values.uiMode === option.key}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      values.uiMode === option.key
                        ? 'bg-white border-sage-600 ring-1 ring-sage-600/30'
                        : 'bg-white border-ink-200 hover:border-ink-300'
                    }`}
                  >
                    <span className="block text-xs font-bold text-ink-900">{option.label}</span>
                    <span className="block text-[11px] text-ink-500 leading-snug">{option.desc}</span>
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-ink-500 leading-relaxed">
                Mode Lansia menyembunyikan dashboard dan riwayat, menyisakan pengukuran rPPG beserta
                hasilnya dan asisten chat.
              </p>
            </div>

            {/* AKUN — hanya untuk profil sendiri */}
            {accountEmail && (
              <div className="p-3.5 rounded-2xl bg-ink-50/60 border border-ink-200/80 space-y-3">
                <span className="text-xs font-bold text-ink-800 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sage-700" />
                  Akun
                </span>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-ink-700">Email</Label>
                  <Input value={accountEmail} disabled readOnly className={fieldClass} />
                  <p className="text-[11px] text-ink-500">
                    Email dan kata sandi tidak dapat diubah dari sini demi keamanan akun.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="profilePhone"
                    className="text-xs font-semibold text-ink-700 flex items-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-ink-400" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="profilePhone"
                    type="tel"
                    placeholder="Contoh: +628123456789"
                    value={values.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    className={fieldClass}
                  />
                </div>
              </div>
            )}

            {/* PIN — backend hanya menerimanya saat pembuatan profil */}
            {isCreate && (
              <div className="p-3.5 rounded-2xl bg-ink-50/60 border border-ink-200/80 space-y-2">
                <Label
                  htmlFor="profilePin"
                  className="text-xs font-bold text-ink-800 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-sage-700" />
                  PIN Akses Profil (Opsional)
                </Label>
                <Input
                  id="profilePin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Masukkan 4-6 digit PIN (opsional)"
                  value={values.pin}
                  onChange={(e) => set('pin', e.target.value.replace(/\D/g, ''))}
                  className={fieldClass}
                />
                <p className="text-[11px] text-ink-500 leading-relaxed">
                  Kosongkan jika profil bebas dipilih tanpa PIN. Jika diisi, profil akan diminta PIN
                  saat dipilih.
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

          <DialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-ink-100">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold rounded-full px-4 cursor-pointer text-ink-600 hover:text-ink-900"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="bg-ink-900 text-white text-xs font-bold rounded-full px-5 shadow-xs cursor-pointer hover:bg-ink-800 disabled:opacity-70"
            >
              {isSaving ? 'Menyimpan…' : isCreate ? 'Simpan Profil Anggota' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProfileFormDialog
