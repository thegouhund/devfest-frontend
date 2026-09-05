import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Chip } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TextField, FieldError } from '@/components/ui/field'
import { Check, Video, ChevronRight, AlertTriangle } from 'lucide-react'
import { ApiError } from '@/lib/api'
import { updateProfile } from '@/lib/auth-api'
import { useAuth } from '../context/AuthContext'

export interface OnboardingData {
  // Step 1: Signup
  fullName: string
  email: string
  password: string
  confirmPassword: string
  // Step 2: Profile
  birthDate: string
  gender: 'male' | 'female' | ''
  height: string
  weight: string
  // Step 3: Consent
  consentCamera: boolean
  consentTerms: boolean
}

interface OnboardingProps {
  onComplete?: (data: OnboardingData) => void
  onCancel?: () => void
  onNavigateToLogin?: () => void
}

export const Onboarding: React.FC<OnboardingProps> = ({
  onComplete,
  onCancel,
  onNavigateToLogin,
}) => {
  const { register } = useAuth()
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: 'male',
    height: '',
    weight: '',
    consentCamera: false,
    consentTerms: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCompleted, setIsCompleted] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  /** Terisi setelah akun berhasil dibuat di langkah 1. */
  const [createdProfileId, setCreatedProfileId] = useState<string | null>(null)
  const accountCreated = createdProfileId !== null

  // Backend memakai model satu akun = satu keluarga, jadi tidak ada langkah
  // "buat/gabung keluarga" — akun baru otomatis punya profil admin.
  const steps = [
    { id: 1, label: 'Akun' },
    { id: 2, label: 'Profil' },
    { id: 3, label: 'Selesai' },
  ]

  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {}

    if (step === 1) {
      if (!formData.fullName.trim()) errs.fullName = 'Nama lengkap wajib diisi'
      if (!formData.email.trim()) {
        errs.email = 'Alamat email wajib diisi'
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errs.email = 'Format email tidak valid'
      }
      if (!formData.password) {
        errs.password = 'Kata sandi wajib diisi'
      } else if (formData.password.length < 8) {
        errs.password = 'Kata sandi minimal 8 karakter'
      } else if (formData.password.length > 128) {
        errs.password = 'Kata sandi maksimal 128 karakter'
      }
      if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Konfirmasi kata sandi tidak cocok'
      }
    } else if (step === 2) {
      if (!formData.birthDate) errs.birthDate = 'Tanggal lahir wajib diisi'
      if (!formData.gender) errs.gender = 'Pilih jenis kelamin'
      if (!formData.height) {
        errs.height = 'Tinggi badan wajib diisi'
      } else if (Number(formData.height) <= 0 || Number(formData.height) > 250) {
        errs.height = 'Masukkan tinggi badan yang valid (cm)'
      }
      if (!formData.weight) {
        errs.weight = 'Berat badan wajib diisi'
      } else if (Number(formData.weight) <= 0 || Number(formData.weight) > 300) {
        errs.weight = 'Masukkan berat badan yang valid (kg)'
      }
    } else if (step === 3) {
      if (!formData.consentTerms) {
        errs.consentTerms = 'Persetujuan disclaimer kesehatan wajib dicentang'
      }
      if (!formData.consentCamera) {
        errs.consentCamera = 'Persetujuan akses kamera wajib dicentang'
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const goTo = (step: number) => {
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const asApiErrors = (error: unknown) => {
    const message = error instanceof ApiError ? error.message : 'Terjadi kesalahan. Coba lagi.'
    const fields = error instanceof ApiError ? error.fieldErrors : {}
    return {
      form: message,
      ...(fields.email ? { email: fields.email } : {}),
      ...(fields.password ? { password: fields.password } : {}),
      ...(fields.full_name ? { fullName: fields.full_name } : {}),
    }
  }

  // Akun dibuat di akhir langkah 1 supaya email bentrok (409) dan password
  // terlalu pendek (422) ketahuan sebelum user mengisi data profil. Backend
  // tidak punya endpoint cek-ketersediaan-email, jadi /register sendiri yang
  // jadi pemeriksanya — dan itu benar-benar membuat akunnya.
  const submitAccount = async () => {
    setIsSubmitting(true)
    setErrors({})
    try {
      const profile = await register(
        {
          email: formData.email.trim(),
          password: formData.password,
          full_name: formData.fullName.trim(),
        },
        true
      )
      setCreatedProfileId(profile.id)
      goTo(2)
    } catch (error) {
      setErrors(asApiErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Data profil (lahir, gender, tinggi, berat) menyusul lewat PATCH karena
  // endpoint register tidak menerima tinggi & berat.
  const submitProfileDetails = async () => {
    if (!createdProfileId) return
    setIsSubmitting(true)
    setErrors({})
    try {
      const height = Number(formData.height)
      const weight = Number(formData.weight)
      await updateProfile(createdProfileId, {
        ...(formData.birthDate ? { date_of_birth: formData.birthDate } : {}),
        ...(formData.gender ? { gender: formData.gender } : {}),
        ...(height > 0 ? { height_cm: height } : {}),
        ...(weight > 0 ? { weight } : {}),
      })
      setIsCompleted(true)
      onComplete?.(formData)
    } catch (error) {
      setErrors(asApiErrors(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) return

    if (currentStep === 1) {
      // Kembali ke langkah 1 setelah akun terbuat tidak mendaftarkan ulang.
      if (createdProfileId) {
        goTo(2)
        return
      }
      await submitAccount()
      return
    }

    if (currentStep === 2) {
      goTo(3)
      return
    }

    await submitProfileDetails()
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setErrors({})
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-sand text-ink-900 flex flex-col justify-between p-4 sm:p-8 font-sans antialiased">
      {/* Top Header & Brand */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-ink-200/80 p-1 flex items-center justify-center text-lg shadow-xs overflow-hidden shrink-0">
            <img src="/logo.png" alt="Nadiku Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-ink-900 leading-tight">
              Nadiku
            </h1>
            <p className="text-xs font-medium text-ink-600">Penyiapan Akun & Profil</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(onNavigateToLogin || onCancel) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateToLogin || onCancel}
              className="text-xs font-semibold text-ink-600 hover:text-ink-900 rounded-full h-8 px-3 cursor-pointer"
            >
              Masuk ke Akun
            </Button>
          )}
          <Chip size="sm" variant="soft" color="accent" className="font-semibold text-xs">
            Langkah {currentStep} dari {steps.length}
          </Chip>
        </div>
      </header>

      {/* Main Form Container Card */}
      <main className="max-w-3xl w-full mx-auto my-auto">
        <Card className="bg-white rounded-2xl sm:rounded-3xl border border-ink-200/90 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] p-6 sm:p-12 relative overflow-hidden transition-all duration-300">
          {/* Stepper Progress Bar (Centered mathematical alignment for 3 steps) */}
          <div className="mb-10 pb-8 border-b border-ink-100">
            <div className="relative">
              {/* Background connecting line from center of col 1 (16.667%) to center of col 3 (83.333%) */}
              <div
                className="absolute top-[18px] left-[16.667%] right-[16.667%] h-[2px] bg-ink-200 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              {/* Active progress fill */}
              <div
                className="absolute top-[18px] left-[16.667%] h-[2px] bg-ink-900 -translate-y-1/2 transition-all duration-300 pointer-events-none"
                style={{
                  width: `calc(${((currentStep - 1) / (steps.length - 1))} * 66.667%)`,
                }}
                aria-hidden="true"
              />

              {/* 3 Step Columns */}
              <div className="grid grid-cols-3 relative z-10">
                {steps.map((step) => {
                  const isPassed = step.id < currentStep
                  const isActive = step.id === currentStep
                  return (
                    <div
                      key={step.id}
                      className="flex flex-col items-center group cursor-default"
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                          isPassed
                            ? 'bg-ink-900 border-2 border-ink-900 text-white shadow-xs'
                            : isActive
                              ? 'bg-white border-2 border-ink-900 text-ink-900 ring-4 ring-ink-100 shadow-xs'
                              : 'bg-white border-2 border-ink-300 text-ink-400'
                        }`}
                      >
                        {isPassed ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <span
                        className={`mt-2.5 text-xs tracking-wide transition-colors text-center ${
                          isActive
                            ? 'text-ink-950 font-bold'
                            : isPassed
                              ? 'text-ink-800 font-semibold'
                              : 'text-ink-400 font-normal'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Form Content per Step */}
          {isCompleted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center border border-emerald-200">
                <Check className="w-8 h-8 text-emerald-600 stroke-[2]" />
              </div>
              <h2 className="text-2xl font-bold text-ink-900">
                Akun Berhasil Dikonfigurasi!
              </h2>
              <p className="text-ink-600 max-w-md mx-auto text-sm leading-relaxed">
                Selamat datang di Nadiku,{' '}
                <span className="font-semibold text-ink-900">
                  {formData.fullName}
                </span>
                . Data profil dan pengaturan keluarga Anda telah tersimpan dengan
                aman.
              </p>
              <div className="pt-6">
                <Button
                  variant="primary"
                  size="md"
                  className="px-8 py-3 bg-ink-900 hover:bg-ink-800 text-white text-sm font-semibold rounded-full transition shadow-xs"
                  onPress={() => onComplete ? onComplete(formData) : window.location.reload()}
                >
                  Buka Dashboard Sekarang
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {/* STEP 1: SIGNUP */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
                      Daftar Akun Baru
                    </h2>
                    <p className="text-ink-600 text-sm mt-1.5 font-normal">
                      Buat kredensial login untuk mengakses platform pemantauan
                      kesehatan Anda.
                    </p>
                  </div>

                  {accountCreated && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>
                        Akun untuk <strong>{formData.email}</strong> sudah dibuat. Kredensial tidak
                        bisa diubah lagi di sini.
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 pt-2">
                    <TextField isInvalid={Boolean(errors.fullName)} className="w-full">
                      <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                        Nama Lengkap
                      </Label>
                      <Input
                        placeholder="misal: Budi Pratama"
                        value={formData.fullName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        disabled={accountCreated}
                        className="w-full"
                      />
                      {errors.fullName && (
                        <FieldError className="text-xs text-red-500 mt-1 font-medium">
                          {errors.fullName}
                        </FieldError>
                      )}
                    </TextField>

                    <TextField isInvalid={Boolean(errors.email)} className="w-full">
                      <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                        Alamat Email
                      </Label>
                      <Input
                        type="email"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        disabled={accountCreated}
                        className="w-full"
                      />
                      {errors.email && (
                        <FieldError className="text-xs text-red-500 mt-1 font-medium">
                          {errors.email}
                        </FieldError>
                      )}
                    </TextField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextField isInvalid={Boolean(errors.password)} className="w-full">
                        <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                          Kata Sandi
                        </Label>
                        <Input
                          type="password"
                          placeholder="Minimal 8 karakter"
                          value={formData.password}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          disabled={accountCreated}
                          className="w-full"
                        />
                        {errors.password && (
                          <FieldError className="text-xs text-red-500 mt-1 font-medium">
                            {errors.password}
                          </FieldError>
                        )}
                      </TextField>

                      <TextField isInvalid={Boolean(errors.confirmPassword)} className="w-full">
                        <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                          Konfirmasi Sandi
                        </Label>
                        <Input
                          type="password"
                          placeholder="Ulangi kata sandi"
                          value={formData.confirmPassword}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          disabled={accountCreated}
                          className="w-full"
                        />
                        {errors.confirmPassword && (
                          <FieldError className="text-xs text-red-500 mt-1 font-medium">
                            {errors.confirmPassword}
                          </FieldError>
                        )}
                      </TextField>
                    </div>
                  </div>

                  <div className="pt-2 text-center text-xs text-ink-600 font-medium">
                    Sudah memiliki akun terdaftar?{' '}
                    <button
                      type="button"
                      onClick={onNavigateToLogin}
                      className="text-ink-900 hover:text-clay-700 font-bold hover:underline cursor-pointer"
                    >
                      Masuk ke akun Anda
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROFILE & PHYSICAL DATA */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
                      Profil & Informasi Fisik
                    </h2>
                    <p className="text-ink-600 text-sm mt-1.5 font-normal">
                      Data ini diperlukan untuk mengkalibrasi estimasi baseline
                      vital sign dan analisis personal AI.
                    </p>
                  </div>

                  <div className="space-y-5 pt-2">
                    {/* Tanggal Lahir */}
                    <TextField isInvalid={Boolean(errors.birthDate)} className="w-full">
                      <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                        Tanggal Lahir
                      </Label>
                      <Input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({
                            ...formData,
                            birthDate: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                      {errors.birthDate && (
                        <FieldError className="text-xs text-red-500 mt-1 font-medium">
                          {errors.birthDate}
                        </FieldError>
                      )}
                    </TextField>

                    {/* Gender Pill Selection using shadcn Buttons */}
                    <div>
                      <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">
                        Jenis Kelamin
                      </Label>
                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={formData.gender === 'male' ? 'primary' : 'outline'}
                          onClick={() => setFormData({ ...formData, gender: 'male' })}
                          className={`rounded-xl text-sm font-semibold transition px-5 py-2.5 h-auto cursor-pointer ${
                            formData.gender === 'male'
                              ? 'bg-ink-900 text-white border-ink-900 hover:bg-ink-800 shadow-xs'
                              : 'bg-white text-ink-700 border-ink-300 hover:bg-ink-50 hover:text-ink-900'
                          }`}
                        >
                          Pria
                        </Button>
                        <Button
                          type="button"
                          variant={formData.gender === 'female' ? 'primary' : 'outline'}
                          onClick={() => setFormData({ ...formData, gender: 'female' })}
                          className={`rounded-xl text-sm font-semibold transition px-5 py-2.5 h-auto cursor-pointer ${
                            formData.gender === 'female'
                              ? 'bg-ink-900 text-white border-ink-900 hover:bg-ink-800 shadow-xs'
                              : 'bg-white text-ink-700 border-ink-300 hover:bg-ink-50 hover:text-ink-900'
                          }`}
                        >
                          Wanita
                        </Button>
                      </div>
                      {errors.gender && (
                        <p className="text-xs text-red-500 mt-1 font-medium">
                          {errors.gender}
                        </p>
                      )}
                    </div>

                    {/* Tinggi & Berat Badan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextField isInvalid={Boolean(errors.height)} className="w-full">
                        <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                          Tinggi Badan (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="170"
                          value={formData.height}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData({
                              ...formData,
                              height: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                        {errors.height && (
                          <FieldError className="text-xs text-red-500 mt-1 font-medium">
                            {errors.height}
                          </FieldError>
                        )}
                      </TextField>

                      <TextField isInvalid={Boolean(errors.weight)} className="w-full">
                        <Label className="block text-xs font-bold text-ink-700 uppercase tracking-wider mb-1.5">
                          Berat Badan (kg)
                        </Label>
                        <Input
                          type="number"
                          placeholder="65"
                          value={formData.weight}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData({
                              ...formData,
                              weight: e.target.value,
                            })
                          }
                          className="w-full"
                        />
                        {errors.weight && (
                          <FieldError className="text-xs text-red-500 mt-1 font-medium">
                            {errors.weight}
                          </FieldError>
                        )}
                      </TextField>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: CONSENT & CAMERA PERMISSION */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight">
                      Izin Kamera & Privasi
                    </h2>
                    <p className="text-ink-600 text-sm mt-1.5 font-normal">
                      Memastikan kenyamanan, privasi, dan pemahaman Anda sebelum
                      memulai pengukuran.
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    {/* Educational Card on rPPG */}
                    <div className="p-4 sm:p-5 bg-ink-50/60 border border-ink-200 rounded-2xl">
                      <div className="flex gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 text-teal-600 flex-shrink-0 flex items-center justify-center">
                          <Video className="w-4 h-4 text-teal-600" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-ink-950 uppercase tracking-wide">
                            Teknologi Non-Invasif rPPG
                          </h3>
                          <p className="text-xs text-ink-700 leading-relaxed font-normal">
                            Aplikasi membaca variasi mikroskopis warna kulit
                            wajah saat denyut nadi memompa darah. Kamera hanya
                            aktif saat Anda menekan tombol ukur, dan data
                            terenkripsi dengan standar privasi tinggi.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Non-Diagnostic Medical Disclaimer */}
                    <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-300/80 rounded-2xl">
                      <div className="flex gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 text-amber-600 flex-shrink-0 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                            Pernyataan Batasan Medis
                          </h3>
                          <p className="text-xs text-ink-800 leading-relaxed font-normal">
                            Nadiku dirancang untuk pemantauan kebugaran dan pola
                            kesehatan umum keluarga. Alat ini
                            <strong> bukan alat diagnostik medis</strong> dan
                            tidak menggantikan pemeriksaan dokter profesional,
                            ECG, atau pulse oximeter klinis.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Consent Checkboxes using shadcn Checkbox */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="consentTerms"
                          checked={formData.consentTerms}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              consentTerms: Boolean(checked),
                            })
                          }
                          className="mt-0.5 cursor-pointer"
                        />
                        <label
                          htmlFor="consentTerms"
                          className="text-xs text-ink-800 font-medium leading-normal cursor-pointer"
                        >
                          Saya memahami bahwa platform ini bersifat informasional
                          dan bukan pengganti penanganan medis klinis.
                        </label>
                      </div>
                      {errors.consentTerms && (
                        <p className="text-xs text-red-500 pl-7 font-medium">
                          {errors.consentTerms}
                        </p>
                      )}

                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="consentCamera"
                          checked={formData.consentCamera}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              consentCamera: Boolean(checked),
                            })
                          }
                          className="mt-0.5 cursor-pointer"
                        />
                        <label
                          htmlFor="consentCamera"
                          className="text-xs text-ink-800 font-medium leading-normal cursor-pointer"
                        >
                          Saya mengizinkan akses kamera browser saat sesi
                          pengukuran vital sign rPPG berlangsung.
                        </label>
                      </div>
                      {errors.consentCamera && (
                        <p className="text-xs text-red-500 pl-7 font-medium">
                          {errors.consentCamera}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons with shadcn Button */}
              {errors.form && (
                <div className="mt-6 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{errors.form}</span>
                </div>
              )}

              <div className="mt-10 pt-6 border-t border-ink-100 flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="md"
                  onPress={handleBack}
                  isDisabled={currentStep === 1 || isSubmitting}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wide border transition-all duration-200 ${
                    currentStep === 1
                      ? 'opacity-0 pointer-events-none'
                      : 'border-ink-300 text-ink-800 bg-white hover:bg-ink-50 hover:border-ink-400 active:scale-95 shadow-xs'
                  }`}
                >
                  Kembali
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onPress={handleNext}
                  isDisabled={isSubmitting}
                  className="px-7 py-2.5 rounded-full text-xs font-bold tracking-wide bg-ink-900 hover:bg-ink-800 text-white flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-xs cursor-pointer disabled:opacity-75"
                >
                  <span>
                    {isSubmitting
                      ? currentStep === 1
                        ? 'Memeriksa & mendaftarkan…'
                        : 'Menyimpan…'
                      : currentStep === 3
                      ? 'Selesai & Mulai'
                      : currentStep === 1 && !accountCreated
                      ? 'Daftar & Lanjutkan'
                      : 'Lanjutkan'}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </main>

      {/* Persistent Disclaimer Footer */}
      <footer className="max-w-3xl w-full mx-auto text-center pt-6 pb-2 text-xs font-medium text-ink-500">
        Nadiku &copy; 2026 &middot; Platform wellness non-diagnostik berbasis
        rPPG & ML Anomaly Detection.
      </footer>
    </div>
  )
}

export default Onboarding
