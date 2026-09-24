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

type Section = {
  id: string
  name: string
  slug: string
  content: string
  position: number
  updated_at: string
}

type Props = {
  project: Project
  initialSections: Section[]
}

const DEFAULT_LATEX = `\\documentclass[11pt,a4paper]{article}

\\usepackage[margin=1in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\begin{document}

\\begin{center}
    {\\LARGE \\textbf{Your Name}}\\\\
    \\vspace{4pt}
    Software Engineer
\\end{center}

\\section*{Experience}

\\textbf{Software Engineer} \\hfill 2025 -- Present

\\begin{itemize}[leftmargin=*]
    \\item Built scalable web applications using modern technologies.
    \\item Collaborated with engineering teams to deliver production features.
\\end{itemize}

\\section*{Projects}

\\textbf{Elvori}
\\begin{itemize}[leftmargin=*]
    \\item Conversational LaTeX document workspace.
\\end{itemize}

\\section*{Education}

Bachelor of Computer Applications

\\end{document}`

export default function WorkspaceClient({
  project,
  initialSections,
}: Props) {
  const sections =
    initialSections.length > 0
      ? initialSections
      : [
          {
            id: 'draft',
            name: 'Main Document',
            slug: 'main-document',
            content: DEFAULT_LATEX,
            position: 0,
            updated_at: new Date().toISOString(),
          },
        ]

  const [activeSection, setActiveSection] = useState(sections[0])
  const [latex, setLatex] = useState(activeSection.content)
  const [showAi, setShowAi] = useState(false)
  const [aiMessage, setAiMessage] = useState('')
  const [compiling, setCompiling] = useState(false)
  const [compiled, setCompiled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveState, setSaveState] = useState<'saved' | 'unsaved' | 'error'>(
    'saved',
  )
  const [saveError, setSaveError] = useState('')

  function selectSection(section: Section) {
    setActiveSection(section)
    setLatex(section.content)
    setCompiled(false)
    setSaveState('saved')
    setSaveError('')
  }

  async function handleSave() {
    if (activeSection.id === 'draft') {
      setSaveError('Create the document section before saving.')
      setSaveState('error')
      return
    }

    setSaving(true)
    setSaveError('')

    try {
      const response = await fetch(
        `/api/projects/${project.id}/sections/${activeSection.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: latex,
          }),
        },
      )

      const result = await response.json()

      if (!response.ok) {
        setSaveError(result.error ?? 'Unable to save document.')
        setSaveState('error')
        return
      }

      setActiveSection(result.data)
      setSaveState('saved')
      setCompiled(false)
    } catch {
      setSaveError('Unable to save document.')
      setSaveState('error')
    } finally {
      setSaving(false)
    }
  }

  function handleCompile() {
    setCompiling(true)
    setCompiled(false)

    window.setTimeout(() => {
      setCompiling(false)
      setCompiled(true)
    }, 900)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            ←
          </Link>

          <div className="h-5 w-px bg-neutral-200" />

          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">
              {project.name}
            </h1>
          </div>

          <span
            className={`hidden rounded-full px-2.5 py-1 text-[10px] font-medium sm:block ${
              saveState === 'saved'
                ? 'bg-emerald-50 text-emerald-600'
                : saveState === 'error'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-amber-50 text-amber-600'
            }`}
          >
            {saveState === 'saved'
              ? 'Saved'
              : saveState === 'error'
                ? 'Save failed'
                : 'Unsaved'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {compiled && (
            <span className="mr-2 hidden text-xs text-emerald-600 sm:block">
              Compiled
            </span>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || saveState === 'saved'}
            className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-200 disabled:cursor-default disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() => setShowAi((value) => !value)}
            className={`rounded-full px-4 py-2 text-xs font-medium transition ${
              showAi
                ? 'bg-neutral-950 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            ✦ AI
          </button>

          <button
            type="button"
            onClick={handleCompile}
            disabled={compiling}
            className="rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
          >
            {compiling ? 'Compiling…' : 'Compile'}
          </button>
        </div>
      </header>

      {/* Workspace */}
      <div className="flex min-h-0 flex-1">
        {/* Sections */}
        <aside className="hidden w-56 shrink-0 border-r border-neutral-200 bg-[#fafafa] lg:flex lg:flex-col">
          <div className="px-4 pb-3 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
              Document
            </p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-2">
            {sections.map((section, index) => {
              const active = section.id === activeSection.id

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => selectSection(section)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? 'bg-white font-medium text-neutral-950 shadow-sm ring-1 ring-neutral-200'
                      : 'text-neutral-500 hover:bg-white hover:text-neutral-900'
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[10px] text-neutral-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <span className="truncate">{section.name}</span>
                </button>
              )
            })}

            <button
              type="button"
              className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-neutral-400 transition hover:bg-white hover:text-neutral-700"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-neutral-300">
                +
              </span>
              New section
            </button>
          </nav>

          <div className="border-t border-neutral-200 p-4">
            <p className="truncate text-xs text-neutral-400">
              {project.description || 'LaTeX document'}
            </p>
          </div>
        </aside>

        {/* Editor */}
        <section className="flex min-w-0 flex-1 flex-col border-r border-neutral-200 bg-[#1e1e1e]">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#252525] px-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-white/80">
                {activeSection.name}
              </span>

              <span className="text-[10px] text-white/30">
                LaTeX
              </span>
            </div>

            <span className="font-mono text-[10px] text-white/30">
              {latex.length.toLocaleString()} chars
            </span>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 border-r border-white/5 bg-[#191919] pt-5 text-right font-mono text-[11px] leading-6 text-white/20">
              {latex.split('\n').map((_, index) => (
                <div key={index} className="pr-3">
                  {index + 1}
                </div>
              ))}
            </div>

            <textarea
              value={latex}
              onChange={(event) => {
                setLatex(event.target.value)
                setSaveState('unsaved')
                setSaveError('')
                setCompiled(false)
              }}
              spellCheck={false}
              className="h-full w-full resize-none bg-[#1e1e1e] py-5 pl-16 pr-6 font-mono text-[13px] leading-6 text-[#e5e5e5] outline-none"
              aria-label="LaTeX editor"
            />
          </div>

          <div className="flex h-8 shrink-0 items-center justify-between border-t border-white/10 bg-[#252525] px-4 font-mono text-[10px] text-white/30">
            <span>
              {saveError || (saveState === 'saved' ? 'Saved' : 'Changes not saved')}
            </span>
            <span>LaTeX · UTF-8</span>
          </div>
        </section>

        {/* Preview */}
        <section className="hidden min-w-0 flex-1 bg-[#ededed] xl:flex xl:flex-col">
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4">
            <span className="text-xs font-medium text-neutral-600">
              Preview
            </span>

            <span className="text-[10px] text-neutral-400">
              {compiled ? 'Latest compilation' : 'Preview'}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-8">
            <div className="mx-auto min-h-[900px] w-full max-w-[680px] bg-white px-14 py-16 shadow-[0_8px_35px_rgba(0,0,0,0.08)]">
              <div className="text-center">
                <div className="text-xl font-bold">Your Name</div>
                <div className="mt-2 text-xs text-neutral-400">
                  Software Engineer
                </div>
              </div>

              <PreviewSection title="Experience">
                <p>
                  <strong>Software Engineer</strong>
                  <span className="float-right text-xs text-neutral-500">
                    2025 — Present
                  </span>
                </p>

                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-neutral-600">
                  <li>
                    Built scalable web applications using modern
                    technologies.
                  </li>
                  <li>
                    Collaborated with engineering teams to deliver
                    production features.
                  </li>
                </ul>
              </PreviewSection>

              <PreviewSection title="Projects">
                <p className="text-xs font-semibold">Elvori</p>
                <p className="mt-2 text-xs leading-5 text-neutral-600">
                  Conversational LaTeX document workspace.
                </p>
              </PreviewSection>

              <PreviewSection title="Education">
                <p className="text-xs text-neutral-600">
                  Bachelor of Computer Applications
                </p>
              </PreviewSection>
            </div>
          </div>
        </section>

        {/* AI panel */}
        {showAi && (
          <aside className="absolute bottom-4 right-4 z-30 flex w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-[24px] border border-neutral-200 bg-white shadow-[0_20px_70px_rgba(0,0,0,0.16)] sm:w-96 lg:right-6">
            <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
              <div>
                <p className="text-sm font-semibold">Elvori AI</p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  Your document copilot
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAi(false)}
                className="text-neutral-400 hover:text-neutral-950"
              >
                ×
              </button>
            </div>

            <div className="min-h-44 px-5 py-5">
              <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-neutral-100 px-4 py-3 text-xs leading-5 text-neutral-600">
                What would you like to change in this document?
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {[
                  'Improve wording',
                  'Add experience',
                  'Fix formatting',
                  'Make it concise',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => setAiMessage(prompt)}
                    className="rounded-xl border border-neutral-200 px-3 py-2 text-left text-[11px] text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-100 p-3">
              <div className="flex items-end gap-2 rounded-2xl bg-neutral-100 p-2">
                <textarea
                  rows={2}
                  value={aiMessage}
                  onChange={(event) => setAiMessage(event.target.value)}
                  placeholder="Ask Elvori to change your document…"
                  className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-xs outline-none placeholder:text-neutral-400"
                />

                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-sm text-white"
                >
                  ↑
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  )
}

function PreviewSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 border-b border-neutral-900 pb-1 text-sm font-bold">
        {title}
      </h2>
      {children}
    </section>
  )
}
