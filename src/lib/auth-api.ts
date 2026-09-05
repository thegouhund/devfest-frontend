import { request } from './api'

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface Profile {
  id: string
  full_name: string
  date_of_birth: string | null
  gender: string | null
  relationship_label: string | null
  height_cm: number | null
  weight: number | null
  role: 'admin' | 'member'
  ui_mode: 'standard' | 'elderly'
  is_active: boolean
  has_pin: boolean
  created_at: string
}

export interface RegisterInput {
  email: string
  password: string
  full_name: string
  date_of_birth?: string | null
  gender?: string | null
}

export const register = (input: RegisterInput) =>
  request<TokenResponse>('/auth/register', { method: 'POST', json: input, anonymous: true })

// Backend memakai form OAuth2: field bernama `username` tapi diisi email.
export const login = (email: string, password: string) =>
  request<TokenResponse>('/auth/login', {
    method: 'POST',
    form: { username: email, password },
    anonymous: true,
  })

export const selectProfile = (profileId: string, pin?: string) =>
  request<TokenResponse>('/auth/select-profile', {
    method: 'POST',
    json: pin ? { profile_id: profileId, pin } : { profile_id: profileId },
  })

export const listProfiles = () =>
  request<{ profiles: Profile[] }>('/profiles').then((r) => r.profiles)

export const getActiveProfile = () => request<Profile>('/profiles/me')

export const updateProfile = (id: string, patch: Partial<Profile>) =>
  request<Profile>(`/profiles/${id}`, { method: 'PATCH', json: patch })

export interface CreateProfileInput {
  full_name: string
  date_of_birth?: string | null
  gender?: string | null
  relationship_label?: string | null
  height_cm?: number | null
  weight?: number | null
  ui_mode?: 'standard' | 'elderly'
  /** Kalau diisi, profil terkunci PIN. `role` tidak bisa ditentukan di sini —
   *  backend selalu membuat anggota biasa. */
  pin?: string | null
}

export const createProfile = (input: CreateProfileInput) =>
  request<Profile>('/profiles', { method: 'POST', json: input })

export const deactivateProfile = (id: string) =>
  request<void>(`/profiles/${id}`, { method: 'DELETE' })

export interface FamilyDashboardMember {
  family_member_id: string
  full_name: string
  last_measurement_at: string | null
  latest: { metric_type: string; value: number; unit: string | null }[]
  open_anomalies: number
}

export interface Account {
  id: string
  email: string
  phone: string | null
  created_at: string
}

export const getAccount = () => request<Account>('/account/me')

/** Hanya `phone` yang bisa diubah; email & password sengaja tidak tersedia. */
export const updateAccount = (phone: string | null) =>
  request<Account>('/account/me', { method: 'PATCH', json: { phone } })

export const getFamilyDashboard = () =>
  request<{ members: FamilyDashboardMember[] }>('/profiles/dashboard/family').then((r) => r.members)

/** Umur dari tanggal lahir; null kalau backend belum punya datanya. */
export const ageFrom = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null
  const born = new Date(dateOfBirth)
  if (Number.isNaN(born.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - born.getFullYear()
  const monthDiff = now.getMonth() - born.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < born.getDate())) age--
  return age
}

export const initialsFrom = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'
