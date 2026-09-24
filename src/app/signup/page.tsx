'use client'

import Link from 'next/link'
import { useActionState } from 'react'

import { signUp, type AuthActionState } from '@/lib/auth/actions'

const initialState: AuthActionState = {
  error: null,
  success: null,
}

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Create your Elvori account</h1>
          <p className="mt-2 text-sm text-gray-600">
            Start building your documents.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <input
            name="displayName"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Display name"
            className="w-full rounded-lg border px-4 py-3"
          />

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
            autoComplete="new-password"
            placeholder="Password"
            className="w-full rounded-lg border px-4 py-3"
          />

          {state.error && (
            <p role="alert" className="text-sm text-red-600">
              {state.error}
            </p>
          )}

          {state.success && (
            <p role="status" className="text-sm text-green-700">
              {state.success}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-black px-4 py-3 text-white disabled:opacity-50"
          >
            {pending ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-black underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
