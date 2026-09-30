'use client'

import { useCallback, useEffect, useState } from 'react'

type Version = {
  id: string
  version_number: number
  created_by: string | null
  created_at: string
}

type SnapshotSection = {
  id: string
  name: string
  slug: string
  content: string
  position: number
}

type VersionDetail = Version & {
  snapshot: {
    sections: SnapshotSection[]
  }
}

type VersionHistoryProps = {
  projectId: string
  currentVersion?: number
  onRestored: () => Promise<void> | void
}

export function VersionHistory({
  projectId,
  currentVersion,
  onRestored,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [selected, setSelected] = useState<VersionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState('')

  const loadVersions = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions`,
        { cache: 'no-store' },
      )

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load version history.')
      }

      setVersions(payload.data ?? [])
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load version history.',
      )
    } finally {
      setLoading(false)
    }
  }, [projectId])

  async function loadVersion(versionId: string) {
    setLoadingDetail(true)
    setError('')

    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}`,
        { cache: 'no-store' },
      )

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to load version.')
      }

      setSelected(payload.data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load version.',
      )
    } finally {
      setLoadingDetail(false)
    }
  }

  async function restoreVersion(versionId: string, versionNumber: number) {
    const confirmed = window.confirm(
      `Restore version ${versionNumber}? Your current document will be preserved as a new version.`,
    )

    if (!confirmed) return

    setRestoring(true)
    setError('')

    try {
      const response = await fetch(
        `/api/projects/${projectId}/versions/${versionId}/restore`,
        {
          method: 'POST',
        },
      )

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error ?? 'Unable to restore version.')
      }

      setSelected(null)
      await loadVersions()
      await onRestored()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to restore version.',
      )
    } finally {
      setRestoring(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVersions()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadVersions])

  return (
    <aside className="flex h-full w-full flex-col border-l border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Version History</h2>
          <p className="text-xs text-zinc-500">
            Saved document snapshots
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadVersions()}
          disabled={loading}
          className="rounded-md px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="border-b border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-sm text-zinc-500">
            Loading versions...
          </div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-sm text-zinc-500">
            No versions saved yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {versions.map((version) => (
              <button
                key={version.id}
                type="button"
                onClick={() => void loadVersion(version.id)}
                className="block w-full px-4 py-3 text-left hover:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">
                    Version {version.version_number}
                  </span>

                  {currentVersion === version.version_number && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                      Current
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-zinc-500">
                  {new Date(version.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="max-h-[55%] border-t border-zinc-800 bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">
                Version {selected.version_number}
              </p>
              <p className="text-xs text-zinc-500">
                {new Date(selected.created_at).toLocaleString()}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-zinc-500 hover:text-white"
            >
              Close
            </button>
          </div>

          {loadingDetail ? (
            <div className="p-4 text-sm text-zinc-500">
              Loading snapshot...
            </div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto p-4">
                {selected.snapshot.sections.map((section) => (
                  <div key={section.id} className="mb-4 last:mb-0">
                    <p className="mb-1 text-xs font-semibold text-zinc-300">
                      {section.name}
                    </p>

                    <pre className="overflow-x-auto rounded-md bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-400">
                      {section.content}
                    </pre>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-800 p-4">
                <button
                  type="button"
                  disabled={
                    restoring ||
                    currentVersion === selected.version_number
                  }
                  onClick={() =>
                    void restoreVersion(
                      selected.id,
                      selected.version_number,
                    )
                  }
                  className="w-full rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {restoring
                    ? 'Restoring...'
                    : currentVersion === selected.version_number
                      ? 'Current Version'
                      : `Restore Version ${selected.version_number}`}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
