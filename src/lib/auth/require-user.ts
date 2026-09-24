import 'server-only'

import { getSupabaseSession } from '@/lib/auth/session'
import { UnauthorizedError } from '@/lib/auth/errors'

export async function requireUser() {
  const user = await getSupabaseSession()

  if (!user) {
    throw new UnauthorizedError()
  }

  return user
}
