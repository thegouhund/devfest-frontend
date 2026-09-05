import { request } from './api'

export type MetricType = 'heart_rate' | 'hrv_rmssd' | 'respiration_rate'

export interface Reading {
  metric_type: string
  value: number
  unit: string | null
}

export interface MetricSummary {
  metric_type: string
  unit: string | null
  avg: number
  min: number
  max: number
  count: number
  baseline: { mean: number; stddev: number; is_active: boolean } | null
  previous_period: { avg: number; change_percent: number | null } | null
}

export interface SummaryResponse {
  period: { start: string; end: string }
  metrics: MetricSummary[]
}

export interface TrendBucket {
  bucket: string
  avg: number
  min: number
  max: number
  count: number
}

export interface TrendResponse {
  metric_type: string
  unit: string | null
  buckets: TrendBucket[]
}

export interface MeasurementSession {
  id: string
  family_member_id: string
  capture_method: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  signal_quality_flag: 'good' | 'fair' | 'poor' | 'rejected' | null
  signal_quality_score: number | null
  started_at: string | null
  ended_at: string | null
  duration_seconds: number | null
}

export interface MeasurementResult {
  session_id: string
  recorded_at: string | null
  signal_quality_score: number | null
  signal_quality_flag: 'good' | 'fair' | 'poor' | 'rejected' | null
  readings: Reading[]
  disclaimer: string
}

export interface Anomaly {
  id: string
  family_member_id: string
  metric_type: string
  observed_value: number
  baseline_mean: number
  baseline_stddev: number
  deviation_score: number
  severity: 'low' | 'medium' | 'high'
  status: 'new' | 'acknowledged' | 'dismissed'
  detected_at: string | null
}

export interface ActivityResponse {
  id: string
  family_member_id: string
  logged_by_family_member_id: string
  category: string
  quantity: number | null
  unit: string | null
  note: string | null
  source: 'menu' | 'chat'
  occurred_at: string | null
}

interface RangeQuery {
  start: string
  end: string
  family_member_id?: string
}

// Berbeda dari dokumen kontrak: endpoint ini tidak menerima metric_type dan
// mengembalikan seluruh metrik sekaligus (diverifikasi lewat /openapi.json).
export const getVitalsSummary = (query: RangeQuery) =>
  request<SummaryResponse>('/vitals/summary', { query: { ...query } })

export const getVitalsTrend = (
  metricType: MetricType,
  query: RangeQuery & { bucket?: 'day' | 'week' | 'month' }
) => request<TrendResponse>('/vitals/trend', { query: { metric_type: metricType, ...query } })

/** Unggah rekaman yang sudah jadi. Content-Type sengaja tidak diisi supaya
 *  browser menetapkan boundary multipart-nya sendiri. */
export const uploadMeasurement = (file: Blob, filename: string, familyMemberId?: string) => {
  const form = new FormData()
  form.append('file', file, filename)
  if (familyMemberId) form.append('family_member_id', familyMemberId)
  return request<{ session_id: string; processing_status: string }>('/measurements/upload', {
    method: 'POST',
    body: form,
  })
}

export const getMeasurement = (id: string) => request<MeasurementSession>(`/measurements/${id}`)

export const getMeasurementResults = (id: string) =>
  request<MeasurementResult>(`/measurements/${id}/results`)

export const listMeasurements = (limit = 20, familyMemberId?: string) =>
  request<{ sessions: MeasurementSession[]; total: number }>('/measurements', {
    query: { limit, family_member_id: familyMemberId },
  })

export interface AnomalyDetail extends Anomaly {
  related_activity: { category: string; quantity: number | null; occurred_at: string } | null
  measurement_session_id: string | null
}

export const getAnomaly = (id: string) => request<AnomalyDetail>(`/anomalies/${id}`)

export const listAnomalies = (
  query: { status?: string; limit?: number; family_member_id?: string } = {}
) =>
  request<{ anomalies: Anomaly[]; total: number }>('/anomalies', { query: { ...query } })

export const listActivities = (query: Partial<RangeQuery> & { limit?: number } = {}) =>
  request<{ activities: ActivityResponse[]; total: number }>('/activities', { query: { ...query } })

export const createActivity = (body: {
  category: string
  note: string | null
  occurred_at: string
  quantity?: number | null
  unit?: string | null
  family_member_id?: string | null
}) => request<ActivityResponse>('/activities', { method: 'POST', json: body })

export const deleteActivity = (id: string) =>
  request<void>(`/activities/${id}`, { method: 'DELETE' })

export interface ChatConversation {
  id: string
  started_at: string | null
  ended_at: string | null
  summary: string | null
}

export interface ChatServerMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: string | null
}

/** Agent menjawab atas nama profil aktif di token. */
export const postChat = (message: string, conversationId: string | null) =>
  request<{ reply: string; conversation_id: string }>('/chat', {
    method: 'POST',
    json: { message, conversation_id: conversationId },
  })

export const listConversations = () =>
  request<{ conversations: ChatConversation[]; total: number }>('/chat/conversations')

export const getConversation = (id: string) =>
  request<{ id: string; messages: ChatServerMessage[] }>(`/chat/conversations/${id}`)

export const findMetric = (summary: SummaryResponse | null, metric: MetricType) =>
  summary?.metrics.find((m) => m.metric_type === metric) ?? null
