'use client'

import Link from 'next/link'
import { useState } from 'react'

type Project = {
  id: string
  name: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

type Props = {
  initialProjects: Project[]
  email: string
  signOut: () => Promise<void>
}

export default function DashboardClient({
  initialProjects,
  email,
  signOut,
}: Props) {
  const [projects, setProjects] = useState(initialProjects)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  async function createProject(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error ?? 'Unable to create project.')
        return
      }

      setProjects((current) => [result.data, ...current])
      setName('')
      setDescription('')
      setShowCreate(false)
    } catch {
      setError('Unable to create project.')
    } finally {
      setCreating(false)
    }
  }

  const firstName =
    email.split('@')[0]?.split(/[._-]/)[0] || 'there'

  return (
    <>
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8">
        {/* Intro */}
        <section className="mb-12">
          <p className="mb-3 text-sm font-medium text-neutral-400">
            YOUR WORKSPACE
          </p>

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Good morning, {firstName}.
              </h1>

              <p className="mt-3 max-w-xl text-[15px] leading-6 text-neutral-500">
                Create something worth keeping.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="w-fit rounded-full bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-neutral-800"
            >
              + Create
            </button>
          </div>
        </section>

        {/* Featured document */}
        {projects.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Continue creating</h2>

              <span className="text-xs text-neutral-400">
                Recently edited
              </span>
            </div>

            <Link
              href={`/dashboard/projects/${projects[0].id}`}
              className="group block overflow-hidden rounded-[28px] border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.07)]"
            >
              <div className="grid min-h-[330px] md:grid-cols-[1fr_0.8fr]">
                <div className="flex flex-col justify-between p-7 sm:p-10">
                  <div>
                    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950 text-sm text-white">
                      ✦
                    </div>

                    <p className="mb-3 text-xs font-medium uppercase tracking-[0.15em] text-neutral-400">
                      Document
                    </p>

                    <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                      {projects[0].name}
                    </h2>

                    <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-500">
                      {projects[0].description ||
                        'Your document workspace is ready to continue.'}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-3 text-sm text-neutral-500">
                    <span>
                      Edited{' '}
                      {new Date(
                        projects[0].updated_at,
                      ).toLocaleDateString()}
                    </span>

                    <span>·</span>

                    <span className="font-medium text-neutral-950 transition group-hover:underline">
                      Open document →
                    </span>
                  </div>
                </div>

                {/* Paper preview */}
                <div className="flex items-center justify-center bg-neutral-100 p-8">
                  <div className="aspect-[0.707/1] w-[190px] rotate-[1deg] bg-white p-7 shadow-[0_15px_45px_rgba(0,0,0,0.12)] transition duration-500 group-hover:rotate-0 group-hover:scale-[1.02]">
                    <div className="mb-7">
                      <div className="h-3 w-24 bg-neutral-900" />
                      <div className="mt-2 h-1.5 w-16 bg-neutral-200" />
                    </div>

                    <PreviewLines />

                    <div className="mt-7">
                      <div className="mb-2 h-1.5 w-16 bg-neutral-900" />
                      <PreviewLines small />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Documents */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Your documents</h2>

            <span className="text-xs text-neutral-400">
              {projects.length}
            </span>
          </div>

          {projects.length === 0 ? (
            <EmptyState onCreate={() => setShowCreate(true)} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="group"
                >
                  <div className="overflow-hidden rounded-[22px] border border-neutral-200 bg-white transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_16px_45px_rgba(0,0,0,0.06)]">
                    <div className="flex h-[260px] items-center justify-center bg-neutral-100 p-8">
                      <div className="aspect-[0.707/1] h-full max-h-[220px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition duration-300 group-hover:scale-[1.025]">
                        <div className="mb-5">
                          <div className="h-2.5 w-20 bg-neutral-900" />
                          <div className="mt-2 h-1.5 w-12 bg-neutral-200" />
                        </div>

                        <PreviewLines />

                        <div className="mt-5">
                          <div className="mb-2 h-1.5 w-12 bg-neutral-900" />
                          <PreviewLines small />
                        </div>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-semibold">
                            {project.name}
                          </h3>

                          <p className="mt-1 truncate text-xs text-neutral-400">
                            {project.description || 'LaTeX document'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(event) => event.preventDefault()}
                          className="shrink-0 text-lg leading-none text-neutral-400 hover:text-neutral-950"
                          aria-label={`More options for ${project.name}`}
                        >
                          ···
                        </button>
                      </div>

                      <p className="mt-4 text-xs text-neutral-400">
                        Edited{' '}
                        {new Date(
                          project.updated_at,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Mobile account */}
        <div className="mt-12 border-t border-neutral-200 pt-6 sm:hidden">
          <div className="flex items-center justify-between">
            <span className="max-w-[220px] truncate text-xs text-neutral-400">
              {email}
            </span>

            <form action={signOut}>
              <button
                type="submit"
                className="text-xs font-medium text-neutral-600"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[26px] bg-white p-7 shadow-2xl">
            <div className="mb-7">
              <h2 className="text-xl font-semibold tracking-tight">
                Create a document
              </h2>

              <p className="mt-2 text-sm text-neutral-500">
                Start with a blank LaTeX workspace.
              </p>
            </div>

            <form onSubmit={createProject} className="space-y-5">
              <div>
                <label
                  htmlFor="document-name"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Name
                </label>

                <input
                  id="document-name"
                  autoFocus
                  required
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Resume 2026"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="document-description"
                  className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-400"
                >
                  Description
                </label>

                <textarea
                  id="document-description"
                  rows={3}
                  maxLength={2000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="My software engineering resume"
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none transition focus:border-neutral-950 focus:bg-white"
                />
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 rounded-xl px-4 py-3 text-sm font-medium hover:bg-neutral-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 rounded-xl bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function PreviewLines({ small = false }: { small?: boolean }) {
  return (
    <div className="space-y-2">
      <div className={`${small ? 'w-4/5' : 'w-full'} h-1 bg-neutral-200`} />
      <div className="h-1 w-full bg-neutral-200" />
      <div className="h-1 w-3/4 bg-neutral-200" />
      <div className="h-1 w-5/6 bg-neutral-200" />
      <div className="h-1 w-2/3 bg-neutral-200" />
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[28px] border border-neutral-200 bg-white px-6 py-20 text-center">
      <div className="mx-auto max-w-sm">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-950 text-2xl text-white">
          +
        </div>

        <h2 className="text-2xl font-semibold tracking-[-0.03em]">
          Nothing here yet
        </h2>

        <p className="mt-3 text-sm leading-6 text-neutral-500">
          Your documents will live here. Create your first one and start
          building.
        </p>

        <button
          type="button"
          onClick={onCreate}
          className="mt-7 rounded-full bg-neutral-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Create your first document
        </button>
      </div>
    </div>
  )
}
