import { notFound, redirect } from 'next/navigation'
import { getSupabaseSession } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import WorkspaceClient from '@/components/workspace/WorkspaceClient'

type Props = {
  params: Promise<{
    projectId: string
  }>
}

export default async function ProjectWorkspace({ params }: Props) {
  const user = await getSupabaseSession()

  if (!user) {
    redirect('/login')
  }

  const { projectId } = await params
  const supabase = await createClient()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, description, status, created_at, updated_at')
    .eq('id', projectId)
    .eq('owner_id', user.id)
    .single()

  if (projectError || !project) {
    notFound()
  }

  const { data: sections } = await supabase
    .from('document_sections')
    .select('id, name, slug, content, position, updated_at')
    .eq('project_id', project.id)
    .order('position', { ascending: true })

  return (
    <main className="h-screen overflow-hidden bg-[#f7f7f7] text-neutral-950">
      <WorkspaceClient
        project={project}
        initialSections={sections ?? []}
      />
    </main>
  )
}
