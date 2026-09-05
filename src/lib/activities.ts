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

export const createActivity = (input: NewActivityInput): ActivityItem => {
  const [hour, minute] = input.time.split(':').map(Number)
  return {
    id: Date.now().toString(),
    category: input.category,
    title: input.title?.trim() || labelFor(input.category),
    detail: input.detail.trim() || 'Dicatat via Quick Logger',
    date: input.date,
    time: `${input.time} WIB`,
    timestamp: hour + minute / 60,
  }
}
