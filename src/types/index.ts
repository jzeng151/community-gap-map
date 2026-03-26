export type Category = 'food' | 'housing' | 'healthcare' | 'childcare' | 'legal' | 'jobs'
export type ProviderType = 'gov' | 'npo' | 'mutual-aid'
export type AvailabilityStatus = 'open' | 'closed' | 'unknown'
export type PulseStatus = 'visible' | 'hidden'

export interface Offering {
  id: string
  name: string
  category: Category
  provider_type: ProviderType
  address: string | null
  lat: number
  lng: number
  hours_json: Record<string, unknown> | null
  availability_status: AvailabilityStatus
  data_source: string | null
  imported_at: string
  flagged: boolean
}

export interface PulsePost {
  id: string
  category: Category
  neighborhood: string
  lat: number
  lng: number
  created_at: string
  flag_count: number
  status: PulseStatus
}

// Provider type → map pin color
export const PROVIDER_COLORS: Record<ProviderType, string> = {
  'gov': '#3B82F6',       // blue
  'npo': '#22C55E',       // green
  'mutual-aid': '#F97316', // orange
}

export const CATEGORY_LABELS: Record<Category, string> = {
  food: 'Food',
  housing: 'Housing',
  healthcare: 'Healthcare',
  childcare: 'Childcare',
  legal: 'Legal',
  jobs: 'Jobs',
}

export const PROVIDER_LABELS: Record<ProviderType, string> = {
  gov: 'Government',
  npo: 'Nonprofit',
  'mutual-aid': 'Mutual Aid',
}
