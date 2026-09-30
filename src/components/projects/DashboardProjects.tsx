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

export default function DashboardProjects({
  initialProjects,
}: {
  initialProjects: Project[]
}) {
  const [projects, setProjects] = useState(initialProjects)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
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
      setOpen(false)
    } catch {
      setError('Unable to create project.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </p>

        <button
          type="button"
          onClick={() => {
            setError('')
            setOpen(true)
          }}
          className="rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          + New project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-20 text-center">
          <div className="mx-auto max-w-md">
            <div className="mb-4 text-4xl">◇</div>

            <h2 className="text-xl font-semibold">
              Create your first document
            </h2>

            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Start a resume, CV, cover letter, report, thesis, or any other
              LaTeX document.
            </p>

            <button
              type="button"
              onClick={() => setOpen(true)}
              className="mt-6 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-medium text-white"
            >
              Create project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group rounded-2xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm"
            >
              <div className="mb-8 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-100 text-xl">
                  ✦
                </div>

                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-500">
                  {project.status}
                </span>
              </div>

              <h2 className="text-lg font-semibold group-hover:underline">
                {project.name}
              </h2>

              <p className="mt-2 min-h-10 text-sm leading-5 text-neutral-500">
                {project.description || 'No description'}
              </p>

              <p className="mt-6 text-xs text-neutral-400">
                Updated {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">New project</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Create a new document workspace.
              </p>
            </div>

            <form onSubmit={createProject} className="space-y-5">
              <div>
                <label
                  htmlFor="project-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Project name
                </label>

                <input
                  id="project-name"
                  required
                  maxLength={120}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="My Resume"
                  className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="mb-2 block text-sm font-medium"
                >
                  Description
                </label>

                <textarea
                  id="project-description"
                  maxLength={2000}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Optional description"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-950"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-neutral-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {loading ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
