import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { serverEnv } from '@/lib/env/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 },
      )
    }

    const response = NextResponse.json({ success: true })

    const supabase = createServerClient(
      serverEnv.NEXT_PUBLIC_SUPABASE_URL,
      serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get('cookie') ?? ''

            if (!cookieHeader) return []

            return cookieHeader.split(';').map((cookie) => {
              const index = cookie.indexOf('=')

              return {
                name: cookie.slice(0, index).trim(),
                value: decodeURIComponent(cookie.slice(index + 1).trim()),
              }
            })
          },

          setAll(cookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options)
            }
          },
        },
      },
    )

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.session) {
      console.error(
        'Elvori sign-in failed:',
        error?.message ?? 'No session returned',
      )

      return NextResponse.json(
        { error: 'Unable to sign in with those credentials.' },
        { status: 401 },
      )
    }

    return response
  } catch (error) {
    console.error('Elvori sign-in error:', error)

    return NextResponse.json(
      { error: 'Unable to sign in. Please try again.' },
      { status: 500 },
    )
  }
}
