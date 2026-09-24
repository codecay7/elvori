import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSupabaseSession } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/auth/actions'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const user = await getSupabaseSession()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, description, status, created_at, updated_at')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <main className="min-h-screen bg-[#fafafa] text-neutral-950">
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-[#fafafa]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/dashboard"
            className="text-[22px] font-bold tracking-[-0.04em]"
          >
            elvori
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-950 sm:block"
            >
              Search
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
              {(user.email?.[0] ?? 'U').toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <DashboardClient
        initialProjects={projects ?? []}
        email={user.email ?? ''}
        signOut={signOut}
      />
    </main>
  )
}
