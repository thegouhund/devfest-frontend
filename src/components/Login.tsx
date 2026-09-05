import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextField, FieldError } from '@/components/ui/field'
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { ApiError } from '@/lib/api'
import { useAuth } from '../context/AuthContext'

interface LoginProps {
  onNavigateToRegister?: () => void
}

export const Login: React.FC<LoginProps> = ({ onNavigateToRegister }) => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Forgot password modal state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {}

    if (!email.trim()) {
      errs.email = 'Alamat email wajib diisi'
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      errs.email = 'Format alamat email tidak valid'
    }

    if (!password) {
      errs.password = 'Kata sandi wajib diisi'
    } else if (password.length < 8) {
      errs.password = 'Kata sandi minimal 8 karakter'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      // Sukses di sini hanya berarti token tingkat akun; AuthProvider yang
      // mengarahkan ke layar pilih profil.
      await login(email.trim(), password, rememberMe)
      setIsSuccess(true)
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Tidak dapat masuk. Coba lagi.'
      setErrors({ form: message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickDemo = () => {
    setEmail('budi.pratama@nadiku.id')
    setPassword('nadiku2026')
    setErrors({})
  }

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim() || !/\S+@\S+\.\S+/.test(forgotEmail.trim())) {
      return
    }
    setForgotSent(true)
  }

  return (
    <div className="min-h-screen bg-sand text-ink-900 flex flex-col justify-between p-4 sm:p-8 font-sans antialiased">
      {/* Top Header & Branding */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between pb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-ink-200/80 p-1 flex items-center justify-center shadow-xs overflow-hidden shrink-0">
            <img src="/logo.png" alt="Nadiku Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-ink-900 leading-tight">
              Nadiku
            </h1>
            <p className="text-xs font-medium text-ink-600">
              Pemantauan Kesehatan Keluarga
            </p>
          </div>
        </div>

        {onNavigateToRegister && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onNavigateToRegister}
            className="text-xs font-semibold text-ink-700 hover:text-ink-900 hover:bg-ink-100/60 rounded-full h-8 px-3.5 cursor-pointer"
          >
            Daftar Akun
          </Button>
        )}
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto">
        <Card className="bg-white rounded-2xl sm:rounded-3xl border border-ink-200/90 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] p-6 sm:p-10 relative overflow-hidden transition-all duration-300">
          <div className="space-y-6">
            {/* Header Content */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
                Selamat Datang Kembali
              </h2>
              <p className="text-ink-600 text-sm mt-1.5 font-normal leading-relaxed">
                Masuk untuk melihat tren vital sign keluarga dan catatan kesehatan preventif Anda.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <TextField isInvalid={Boolean(errors.email)} className="w-full">
                <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                  Alamat Email
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="w-full pl-10 h-11 bg-white border-ink-200 focus-visible:border-ink-900 focus-visible:ring-2 focus-visible:ring-ink-900/10 rounded-xl text-sm"
                    autoComplete="email"
                    disabled={isLoading || isSuccess}
                  />
                </div>
                {errors.email && (
                  <FieldError className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.email}
                  </FieldError>
                )}
              </TextField>

              {/* Password Field */}
              <TextField isInvalid={Boolean(errors.password)} className="w-full">
                <div className="flex items-center justify-between mb-1.5">
                  <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider">
                    Kata Sandi
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email)
                      setForgotSent(false)
                      setForgotPasswordOpen(true)
                    }}
                    className="text-xs font-semibold text-ink-600 hover:text-ink-900 hover:underline cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 h-11 bg-white border-ink-200 focus-visible:border-ink-900 focus-visible:ring-2 focus-visible:ring-ink-900/10 rounded-xl text-sm"
                    autoComplete="current-password"
                    disabled={isLoading || isSuccess}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-400 hover:text-ink-700 transition cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <FieldError className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {errors.password}
                  </FieldError>
                )}
              </TextField>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                    className="cursor-pointer"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="text-xs text-ink-700 font-medium cursor-pointer select-none"
                  >
                    Ingat saya di perangkat ini
                  </label>
                </div>
              </div>

              {/* Kegagalan dari server: pesannya sengaja tidak membedakan
                  email tidak terdaftar dan password salah */}
              {errors.form && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Primary Submit Button */}
              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isDisabled={isLoading || isSuccess}
                  className="w-full h-11 rounded-full text-sm font-bold tracking-wide bg-ink-900 hover:bg-ink-800 text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 shadow-xs cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Memeriksa Kredensial...
                    </span>
                  ) : isSuccess ? (
                    <span className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      Berhasil Masuk
                    </span>
                  ) : (
                    <>
                      <span>Masuk ke Nadiku</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Akun Demo (1 akun: teks email dan password di bawah tombol login) */}
              <div className="pt-2">
                <div className="p-3.5 rounded-2xl bg-ink-50/70 border border-ink-200/70 text-xs flex items-center justify-between gap-3">
                  <div className="space-y-1 text-left min-w-0">
                    <div className="font-bold text-ink-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-clay-600 shrink-0" />
                      <span>Akun Demo:</span>
                    </div>
                    <div className="text-ink-600 leading-normal">
                      Email: <span className="font-semibold text-ink-900 select-all">budi.pratama@nadiku.id</span>
                    </div>
                    <div className="text-ink-600 leading-normal">
                      Password: <span className="font-semibold text-ink-900 select-all">nadiku2026</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickDemo}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-ink-300 hover:border-ink-400 hover:bg-ink-100/60 text-ink-900 transition-colors shrink-0 cursor-pointer shadow-2xs active:scale-95"
                  >
                    Gunakan
                  </button>
                </div>
              </div>
            </form>

            {/* Switch to Registration */}
            {onNavigateToRegister && (
              <div className="pt-2 text-center text-xs text-ink-600 font-medium border-t border-ink-100">
                Belum memiliki akun keluarga?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="text-ink-900 hover:text-clay-700 font-bold hover:underline cursor-pointer ml-0.5"
                >
                  Mulai Penyiapan Akun
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Privacy & Ethical Reassurance Footnote */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-ink-500 font-medium text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-sage-600 shrink-0" />
          <span>Pengukuran rPPG dienkripsi secara lokal tanpa penyimpanan video di cloud.</span>
        </div>
      </main>

      {/* Forgot Password Dialog/Modal */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <Card className="bg-white rounded-2xl sm:rounded-3xl border border-ink-200 max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-ink-900">Pemulihan Kata Sandi</h3>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(false)}
                className="text-ink-400 hover:text-ink-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotSent ? (
              <div className="py-3 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-xs text-ink-700 leading-relaxed">
                  Tautan instruksi pemulihan telah dikirimkan ke{' '}
                  <span className="font-bold text-ink-900">{forgotEmail}</span>. Silakan periksa kotak masuk Anda.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForgotPasswordOpen(false)}
                  className="rounded-full text-xs font-semibold px-4 py-1.5 h-auto mx-auto cursor-pointer"
                >
                  Tutup
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3.5">
                <p className="text-xs text-ink-600 leading-relaxed">
                  Masukkan email akun Nadiku Anda untuk menerima tautan pemulihan kata sandi.
                </p>
                <Input
                  type="email"
                  placeholder="nama@email.com"
                  value={forgotEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForgotEmail(e.target.value)}
                  className="w-full h-10 bg-white border-ink-200 rounded-xl text-xs"
                  required
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForgotPasswordOpen(false)}
                    className="rounded-full text-xs font-semibold px-3 py-1.5 h-auto cursor-pointer"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="rounded-full text-xs font-bold px-4 py-1.5 h-auto bg-ink-900 text-white cursor-pointer"
                  >
                    Kirim Tautan
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* Persistent Disclaimer Footer */}
      <footer className="max-w-md w-full mx-auto text-center pt-6 pb-2 text-xs font-medium text-ink-500">
        Nadiku &copy; 2026 &middot; Platform wellness non-diagnostik keluarga berbasis rPPG.
      </footer>
    </div>
  )
}

export default Login
