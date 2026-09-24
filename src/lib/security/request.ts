import { NextResponse } from 'next/server'

import { UnauthorizedError } from '@/lib/auth/errors'

export function handleApiError(error: unknown) {
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  }

  console.error('Unhandled API error:', error)

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 },
  )
}
