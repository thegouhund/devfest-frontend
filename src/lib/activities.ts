import { Coffee, Dumbbell, Moon, Utensils, Cigarette, Wine, Pin } from 'lucide-react'

export type ActivityCategory =
  | 'kopi'
  | 'olahraga'
  | 'tidur'
  | 'rokok'
  | 'makan'
  | 'alkohol'
  | 'lainnya'

export interface ActivityItem {
  id: string
  category: ActivityCategory
  title: string
  detail: string
  date: string // yyyy-mm-dd
  time: string
  timestamp: number // posisi pada grafik tren harian
}

export interface NewActivityInput {
  category: ActivityCategory
  title?: string
  detail: string
  date: string // yyyy-mm-dd
  time: string // HH:mm
}

export const activityCategories = [
  { key: 'kopi', label: 'Kopi', icon: Coffee },
  { key: 'olahraga', label: 'Olahraga', icon: Dumbbell },
  { key: 'tidur', label: 'Tidur', icon: Moon },
  { key: 'makan', label: 'Makan', icon: Utensils },
  { key: 'rokok', label: 'Rokok', icon: Cigarette },
  { key: 'alkohol', label: 'Alkohol', icon: Wine },
  { key: 'lainnya', label: 'Lainnya', icon: Pin },
] as const

export const iconFor = (category: ActivityCategory) =>
  activityCategories.find((c) => c.key === category)?.icon ?? Pin

export const labelFor = (category: ActivityCategory) =>
  activityCategories.find((c) => c.key === category)?.label ?? 'Aktivitas'

export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const nowHHMM = () => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const formatDateID = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

const categoryToApi: Record<ActivityCategory, string> = {
  kopi: 'coffee',
  olahraga: 'exercise',
  tidur: 'sleep',
  makan: 'meal',
  rokok: 'smoking',
  alkohol: 'alcohol',
  lainnya: 'other',
}

const categoryFromApi: Record<string, ActivityCategory> = Object.fromEntries(
  Object.entries(categoryToApi).map(([id, api]) => [api, id as ActivityCategory])
)

export const toApiCategory = (category: ActivityCategory) => categoryToApi[category]
export const fromApiCategory = (category: string): ActivityCategory =>
  categoryFromApi[category] ?? 'lainnya'

// ponytail: backend hanya punya satu kolom teks bebas (`note`), sedangkan form
// memisahkan nama aktivitas dan keterangan. Keduanya digabung dengan pemisah
// ini dan dipecah lagi saat dibaca. Kalau backend menambah kolom judul, ganti
// dua fungsi di bawah dan hapus pemisahnya.
const NOTE_SEPARATOR = ' · '

export const buildNote = (input: NewActivityInput): string | null => {
  const title = input.title?.trim()
  const detail = input.detail.trim()
  const named = title && title !== labelFor(input.category) ? title : ''
  return [named, detail].filter(Boolean).join(NOTE_SEPARATOR) || null
}

export const parseNote = (note: string | null, category: ActivityCategory) => {
  if (!note) return { title: labelFor(category), detail: '' }
  const index = note.indexOf(NOTE_SEPARATOR)
  if (index === -1) return { title: labelFor(category), detail: note }
  return {
    title: note.slice(0, index),
    detail: note.slice(index + NOTE_SEPARATOR.length),
  }
}

/** `date` + `time` lokal menjadi satu titik waktu ISO UTC untuk `occurred_at`. */
export const toOccurredAt = (input: NewActivityInput) =>
  new Date(`${input.date}T${input.time}:00`).toISOString()

export const fromOccurredAt = (
  occurredAt: string | null
): Pick<ActivityItem, 'date' | 'time' | 'timestamp'> => {
  const when = occurredAt ? new Date(occurredAt) : new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    date: `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`,
    time: `${pad(when.getHours())}:${pad(when.getMinutes())} WIB`,
    timestamp: when.getHours() + when.getMinutes() / 60,
  }
}
