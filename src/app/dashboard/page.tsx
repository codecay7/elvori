import { redirect } from 'next/navigation'

import { signOut } from '@/lib/auth/actions'
import { getSupabaseSession } from '@/lib/auth/session'

export default async function DashboardPage() {
  const user = await getSupabaseSession()

  if (!user) {
    redirect('/login')
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Elvori Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Signed in as {user.email}
          </p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
