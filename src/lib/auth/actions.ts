'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

import { serverEnv } from '@/lib/env/server'

export type AuthActionState = {
  error: string | null
  success: string | null
}

const initialState: AuthActionState = {
  error: null,
  success: null,
}

const credentialsSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(8).max(128),
})

const signupSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(1).max(120),
})

async function createAuthClient() {
  const cookieStore = await cookies()

  return createServerClient(
    serverEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = credentialsSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!result.success) {
    return {
      ...initialState,
      error: 'Invalid email or password format.',
    }
  }

  const supabase = await createAuthClient()

  const { error } = await supabase.auth.signInWithPassword(result.data)

  if (error) {
    return {
      ...initialState,
      error: 'Unable to sign in with those credentials.',
    }
  }

  redirect('/dashboard')
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const result = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    displayName: formData.get('displayName'),
  })

  if (!result.success) {
    return {
      ...initialState,
      error: 'Please provide valid signup details.',
    }
  }

  const supabase = await createAuthClient()

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        display_name: result.data.displayName,
      },
    },
  })

  if (error) {
    return {
      ...initialState,
      error: 'Unable to create the account.',
    }
  }

  if (data.session) {
    redirect('/dashboard')
  }

  return {
    ...initialState,
    success: 'Account created. Check your email to confirm your account.',
  }
}

export async function signOut() {
  const supabase = await createAuthClient()

  await supabase.auth.signOut()

  redirect('/login')
}
