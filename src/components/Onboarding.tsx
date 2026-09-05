import React, { useState } from 'react'

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
  // Step 3: Family
  familyMode: 'create' | 'join' | 'standalone'
  familyName: string
  inviteCode: string
  // Step 4: Consent
  consentCamera: boolean
  consentTerms: boolean
}

interface OnboardingProps {
  onComplete?: (data: OnboardingData) => void
  onCancel?: () => void
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
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
    familyMode: 'create',
    familyName: '',
    inviteCode: '',
    consentCamera: false,
    consentTerms: false,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const steps = [
    { id: 1, label: 'Akun' },
    { id: 2, label: 'Profil' },
    { id: 3, label: 'Keluarga' },
    { id: 4, label: 'Selesai' },
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
      } else if (formData.password.length < 6) {
        errs.password = 'Kata sandi minimal 6 karakter'
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
      if (formData.familyMode === 'create' && !formData.familyName.trim()) {
        errs.familyName = 'Nama grup keluarga wajib diisi'
      }
      if (formData.familyMode === 'join' && !formData.inviteCode.trim()) {
        errs.inviteCode = 'Kode undangan 6-karakter wajib diisi'
      }
    } else if (step === 4) {
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

  const handleNext = () => {
    if (!validateStep(currentStep)) return

    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setIsCompleted(true)
      if (onComplete) {
        onComplete(formData)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setErrors({})
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F4EE] text-slate-900 flex flex-col justify-between p-4 sm:p-8 font-sans antialiased">
      {/* Top Header & Brand */}
      <header className="max-w-3xl w-full mx-auto flex items-center justify-between pb-6 pt-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              Nadiku
            </h1>
            <p className="text-xs font-medium text-slate-600">Penyiapan Akun & Profil</p>
          </div>
        </div>

        <div className="text-xs text-slate-700 font-semibold bg-white/90 shadow-xs px-3.5 py-1.5 rounded-full border border-stone-200">
          Langkah {currentStep} dari {steps.length}
        </div>
      </header>

      {/* Main Form Container Card */}
      <main className="max-w-3xl w-full mx-auto my-auto">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200/90 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.06)] p-6 sm:p-12 relative overflow-hidden transition-all duration-300">
          {/* Stepper Progress Bar (Perfect mathematical center alignment) */}
          <div className="mb-10 pb-8 border-b border-stone-100">
            <div className="relative">
              {/* Background connecting line from center of col 1 (12.5%) to center of col 4 (87.5%) */}
              <div
                className="absolute top-[18px] left-[12.5%] right-[12.5%] h-[2px] bg-stone-200 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              {/* Active progress fill */}
              <div
                className="absolute top-[18px] left-[12.5%] h-[2px] bg-teal-700 -translate-y-1/2 transition-all duration-300 pointer-events-none"
                style={{
                  width: `calc(${((currentStep - 1) / (steps.length - 1))} * 75%)`,
                }}
                aria-hidden="true"
              />

              {/* 4 Step Columns */}
              <div className="grid grid-cols-4 relative z-10">
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
                            ? 'bg-teal-700 text-white shadow-sm'
                            : isActive
                              ? 'bg-white border-2 border-teal-700 text-teal-800 ring-4 ring-teal-50 shadow-sm'
                              : 'bg-white border-2 border-stone-300 text-stone-400'
                        }`}
                      >
                        {isPassed ? (
                          <svg
                            className="w-4 h-4 stroke-current"
                            viewBox="0 0 24 24"
                            fill="none"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </div>
                      <span
                        className={`mt-2.5 text-xs tracking-wide transition-colors text-center ${
                          isActive
                            ? 'text-teal-950 font-bold'
                            : isPassed
                              ? 'text-slate-800 font-medium'
                              : 'text-stone-400 font-normal'
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
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">
                Akun Berhasil Dikonfigurasi!
              </h2>
              <p className="text-slate-600 max-w-md mx-auto text-sm leading-relaxed">
                Selamat datang di Nadiku,{' '}
                <span className="font-semibold text-slate-900">
                  {formData.fullName}
                </span>
                . Data profil dan pengaturan keluarga Anda telah tersimpan dengan
                aman.
              </p>
              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-full transition shadow-sm"
                >
                  Buka Dashboard Sekarang
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* STEP 1: SIGNUP */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Daftar Akun Baru
                    </h2>
                    <p className="text-slate-600 text-sm mt-1.5 font-normal">
                      Buat kredensial login untuk mengakses platform pemantauan
                      kesehatan Anda.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        placeholder="misal: Budi Pratama"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        className={`w-full px-4 py-2.5 rounded-xl border bg-stone-50/50 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition ${
                          errors.fullName ? 'border-red-400' : 'border-stone-200'
                        }`}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Alamat Email
                      </label>
                      <input
                        type="email"
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className={`w-full px-4 py-2.5 rounded-xl border bg-stone-50/50 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition ${
                          errors.email ? 'border-red-400' : 'border-stone-200'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Kata Sandi
                        </label>
                        <input
                          type="password"
                          placeholder="Minimal 6 karakter"
                          value={formData.password}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-2.5 rounded-xl border bg-stone-50/50 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition ${
                            errors.password
                              ? 'border-red-400'
                              : 'border-stone-200'
                          }`}
                        />
                        {errors.password && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Konfirmasi Sandi
                        </label>
                        <input
                          type="password"
                          placeholder="Ulangi kata sandi"
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className={`w-full px-4 py-2.5 rounded-xl border bg-stone-50/50 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition ${
                            errors.confirmPassword
                              ? 'border-red-400'
                              : 'border-stone-200'
                          }`}
                        />
                        {errors.confirmPassword && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-center text-xs text-slate-600 font-medium">
                    Sudah memiliki akun terdaftar?{' '}
                    <button
                      type="button"
                      className="text-teal-800 font-bold hover:underline"
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
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Profil & Informasi Fisik
                    </h2>
                    <p className="text-slate-600 text-sm mt-1.5 font-normal">
                      Data ini diperlukan untuk mengkalibrasi estimasi baseline
                      vital sign dan analisis personal AI.
                    </p>
                  </div>

                  <div className="space-y-5 pt-2">
                    {/* Tanggal Lahir */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            birthDate: e.target.value,
                          })
                        }
                        className={`w-full px-4 py-2.5 rounded-xl border bg-stone-50/50 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition ${
                          errors.birthDate
                            ? 'border-red-400'
                            : 'border-stone-200'
                        }`}
                      />
                      {errors.birthDate && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.birthDate}
                        </p>
                      )}
                    </div>

                    {/* Gender Pill Selection */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Jenis Kelamin
                      </label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, gender: 'male' })
                          }
                          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                            formData.gender === 'male'
                              ? 'bg-[#D1FAE5] text-emerald-950 border-emerald-400 shadow-xs'
                              : 'bg-white text-slate-700 border-stone-300 hover:border-stone-400 hover:bg-stone-50'
                          }`}
                        >
                          Pria
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, gender: 'female' })
                          }
                          className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                            formData.gender === 'female'
                              ? 'bg-[#D1FAE5] text-emerald-950 border-emerald-400 shadow-xs'
                              : 'bg-white text-slate-700 border-stone-300 hover:border-stone-400 hover:bg-stone-50'
                          }`}
                        >
                          Wanita
                        </button>
                      </div>
                      {errors.gender && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.gender}
                        </p>
                      )}
                    </div>

                    {/* Tinggi & Berat Badan */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Tinggi Badan
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="170"
                            value={formData.height}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                height: e.target.value,
                              })
                            }
                            className={`w-full px-4 py-2.5 pr-12 rounded-xl border bg-stone-50/50 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition ${
                              errors.height
                                ? 'border-red-400'
                                : 'border-stone-200'
                            }`}
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                            cm
                          </span>
                        </div>
                        {errors.height && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.height}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Berat Badan
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="65"
                            value={formData.weight}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                weight: e.target.value,
                              })
                            }
                            className={`w-full px-4 py-2.5 pr-12 rounded-xl border bg-stone-50/50 text-slate-900 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 transition ${
                              errors.weight
                                ? 'border-red-400'
                                : 'border-stone-200'
                            }`}
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 pointer-events-none">
                            kg
                          </span>
                        </div>
                        {errors.weight && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.weight}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: FAMILY SETUP */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Ruang Keluarga
                    </h2>
                    <p className="text-slate-600 text-sm mt-1.5 font-normal">
                      Pilih bagaimana Anda ingin menggunakan Family Health
                      Monitor.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    {/* Option 1: Buat Family Baru */}
                    <div
                      onClick={() =>
                        setFormData({ ...formData, familyMode: 'create' })
                      }
                      className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                        formData.familyMode === 'create'
                          ? 'border-teal-600 bg-teal-50/40 ring-2 ring-teal-600/10'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="familyMode"
                          checked={formData.familyMode === 'create'}
                          onChange={() =>
                            setFormData({ ...formData, familyMode: 'create' })
                          }
                          className="mt-1 text-teal-700 focus:ring-teal-600 h-4 w-4"
                        />
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-slate-900">
                            Buat Family Group Baru
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5 font-normal leading-relaxed">
                            Menjadi Admin grup keluarga untuk mengundang anggota
                            lain dan mengelola profil anak/lansia.
                          </p>

                          {formData.familyMode === 'create' && (
                            <div className="mt-3.5 pt-3 border-t border-teal-100">
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Nama Keluarga
                              </label>
                              <input
                                type="text"
                                placeholder="misal: Keluarga Pratama"
                                value={formData.familyName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    familyName: e.target.value,
                                  })
                                }
                                className={`w-full px-3.5 py-2 rounded-xl border text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 ${
                                  errors.familyName
                                    ? 'border-red-400'
                                    : 'border-stone-300'
                                }`}
                              />
                              {errors.familyName && (
                                <p className="text-xs text-red-500 mt-1 font-medium">
                                  {errors.familyName}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Option 2: Gabung Family */}
                    <div
                      onClick={() =>
                        setFormData({ ...formData, familyMode: 'join' })
                      }
                      className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                        formData.familyMode === 'join'
                          ? 'border-teal-600 bg-teal-50/40 ring-2 ring-teal-600/10'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="familyMode"
                          checked={formData.familyMode === 'join'}
                          onChange={() =>
                            setFormData({ ...formData, familyMode: 'join' })
                          }
                          className="mt-1 text-teal-700 focus:ring-teal-600 h-4 w-4"
                        />
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-slate-900">
                            Gabung dengan Kode Undangan
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5 font-normal leading-relaxed">
                            Punya kode dari anggota keluarga Anda? Masukkan di
                            sini untuk langsung terhubung.
                          </p>

                          {formData.familyMode === 'join' && (
                            <div className="mt-3.5 pt-3 border-t border-teal-100">
                              <label className="block text-xs font-bold text-slate-700 mb-1">
                                Kode Undangan (6 Karakter)
                              </label>
                              <input
                                type="text"
                                placeholder="misal: FAM789"
                                maxLength={8}
                                value={formData.inviteCode}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    inviteCode: e.target.value.toUpperCase(),
                                  })
                                }
                                className={`w-full px-3.5 py-2 rounded-xl border text-sm text-slate-900 font-mono tracking-wider bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 ${
                                  errors.inviteCode
                                    ? 'border-red-400'
                                    : 'border-stone-300'
                                }`}
                              />
                              {errors.inviteCode && (
                                <p className="text-xs text-red-500 mt-1 font-medium">
                                  {errors.inviteCode}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Option 3: Mandiri */}
                    <div
                      onClick={() =>
                        setFormData({ ...formData, familyMode: 'standalone' })
                      }
                      className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                        formData.familyMode === 'standalone'
                          ? 'border-teal-600 bg-teal-50/40 ring-2 ring-teal-600/10'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="familyMode"
                          checked={formData.familyMode === 'standalone'}
                          onChange={() =>
                            setFormData({
                              ...formData,
                              familyMode: 'standalone',
                            })
                          }
                          className="mt-1 text-teal-700 focus:ring-teal-600 h-4 w-4"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Gunakan Secara Mandiri
                          </h3>
                          <p className="text-xs text-slate-600 mt-0.5 font-normal leading-relaxed">
                            Lanjutkan sebagai pengguna individual. Anda tetap
                            dapat membuat atau bergabung ke grup keluarga kapan
                            saja nanti.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: CONSENT & CAMERA PERMISSION */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                      Izin Kamera & Privasi
                    </h2>
                    <p className="text-slate-600 text-sm mt-1.5 font-normal">
                      Memastikan kenyamanan, privasi, dan pemahaman Anda sebelum
                      memulai pengukuran.
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    {/* Educational Card on rPPG */}
                    <div className="p-4 sm:p-5 bg-teal-50/60 border border-teal-200 rounded-2xl">
                      <div className="flex gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-700 text-white flex-shrink-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                            Teknologi Non-Invasif rPPG
                          </h3>
                          <p className="text-xs text-slate-700 leading-relaxed font-normal">
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
                        <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex-shrink-0 flex items-center justify-center font-bold text-sm">
                          !
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                            Pernyataan Batasan Medis
                          </h3>
                          <p className="text-xs text-slate-800 leading-relaxed font-normal">
                            Nadiku dirancang untuk pemantauan kebugaran dan pola
                            kesehatan umum keluarga. Alat ini
                            <strong> bukan alat diagnostik medis</strong> dan
                            tidak menggantikan pemeriksaan dokter profesional,
                            ECG, atau pulse oximeter klinis.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Consent Checkboxes */}
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.consentTerms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              consentTerms: e.target.checked,
                            })
                          }
                          className="mt-1 h-4 w-4 text-teal-700 rounded border-stone-300 focus:ring-teal-600"
                        />
                        <span className="text-xs text-slate-800 font-medium leading-normal">
                          Saya memahami bahwa platform ini bersifat informasional
                          dan bukan pengganti penanganan medis klinis.
                        </span>
                      </label>
                      {errors.consentTerms && (
                        <p className="text-xs text-red-500 pl-7 font-medium">
                          {errors.consentTerms}
                        </p>
                      )}

                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.consentCamera}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              consentCamera: e.target.checked,
                            })
                          }
                          className="mt-1 h-4 w-4 text-teal-700 rounded border-stone-300 focus:ring-teal-600"
                        />
                        <span className="text-xs text-slate-800 font-medium leading-normal">
                          Saya mengizinkan akses kamera browser saat sesi
                          pengukuran vital sign rPPG berlangsung.
                        </span>
                      </label>
                      {errors.consentCamera && (
                        <p className="text-xs text-red-500 pl-7 font-medium">
                          {errors.consentCamera}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Buttons (Matching Reference Image) */}
              <div className="mt-10 pt-6 border-t border-stone-100 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wide border transition-all duration-200 ${
                    currentStep === 1
                      ? 'opacity-0 pointer-events-none'
                      : 'border-stone-300 text-slate-800 bg-white hover:bg-stone-50 hover:border-stone-400 active:scale-95 shadow-xs'
                  }`}
                >
                  Kembali
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="px-7 py-2.5 rounded-full text-xs font-bold tracking-wide bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
                >
                  <span>{currentStep === 4 ? 'Selesai & Mulai' : 'Lanjutkan'}</span>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Disclaimer Footer */}
      <footer className="max-w-3xl w-full mx-auto text-center pt-6 pb-2 text-[11px] font-medium text-slate-500">
        Nadiku &copy; 2026 &middot; Platform wellness non-diagnostik berbasis
        rPPG & ML Anomaly Detection.
      </footer>
    </div>
  )
}

export default Onboarding
