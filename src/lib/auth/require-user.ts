import 'server-only'

import { getSupabaseSession } from '@/lib/auth/session'

export async function requireUser() {
  const user = await getSupabaseSession()

  if (!user) {
    throw new Error('UNAUTHORIZED')
  }

  return user
}
