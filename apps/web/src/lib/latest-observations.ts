import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database, DbObservation } from './database.types'

export async function fetchLatestObservationsForPlatforms(
  client: SupabaseClient<Database>,
  platformIds: string[],
): Promise<DbObservation[]> {
  const uniquePlatformIds = [...new Set(platformIds.filter(Boolean))]
  if (uniquePlatformIds.length === 0) return []

  const results = await Promise.all(
    uniquePlatformIds.map(async (platformId) => {
      const { data, error } = await client
        .from('seat_observations')
        .select('*')
        .eq('platform_id', platformId)
        .order('observed_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.warn('[latest-observations] failed to load latest observation:', platformId, error.message)
        return null
      }

      return data as DbObservation | null
    }),
  )

  return results.filter((row): row is DbObservation => Boolean(row))
}
