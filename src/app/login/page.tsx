'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { signIn, type AuthActionState } from '@/lib/auth/actions'

const initialState: AuthActionState = {
  error: null,
  success: null,
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Sign in to Elvori</h1>
          <p className="mt-2 text-sm text-gray-600">
            Continue to your document workspace.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input
            name="email"
            type="email"
            required
            maxLength={320}
            autoComplete="email"
            placeholder="Email"
            className="w-full rounded-lg border px-4 py-3"
          />

          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="current-password"
            placeholder="Password"
            className="w-full rounded-lg border px-4 py-3"
          />

          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
          >
            {pending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-black underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}
