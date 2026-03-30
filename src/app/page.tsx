import { supabase } from '@/lib/supabase'
import { Offering, PulsePost } from '@/types'
import { MapDashboard } from '@/components/MapDashboard'

async function fetchOfferings(): Promise<Offering[]> {
  const { data, error } = await supabase
    .from('offerings')
    .select('id, name, category, provider_type, address, lat, lng, hours_json, services, availability_status, data_source, imported_at, flagged')
    .eq('flagged', false)

  if (error) {
    console.error('Failed to fetch offerings:', error.message)
    return []
  }
  return data ?? []
}

async function fetchPulsePosts(): Promise<PulsePost[]> {
  const { data, error } = await supabase
    .from('pulse')
    .select('id, category, neighborhood, lat, lng, created_at, flag_count, status')
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('Failed to fetch pulse posts:', error.message)
    return []
  }
  return data ?? []
}

export default async function Home() {
  const [offerings, pulsePosts] = await Promise.all([
    fetchOfferings(),
    fetchPulsePosts(),
  ])

  return <MapDashboard initialOfferings={offerings} initialPulsePosts={pulsePosts} />
}
