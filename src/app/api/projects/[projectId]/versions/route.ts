import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/security/request'

type Props = {
  params: Promise<{
    projectId: string
  }>
}

export async function GET(
  _request: Request,
  { params }: Props,
) {
  try {
    const user = await requireUser()
    const { projectId } = await params

    const supabase = await createClient()

    /*
     * Authorization is performed explicitly here.
     * RLS provides the database-level boundary as well.
     */
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found.' },
        { status: 404 },
      )
    }

    const { data, error } = await supabase
      .from('document_versions')
      .select(
        'id, version_number, created_by, created_at',
      )
      .eq('project_id', projectId)
      .order('version_number', {
        ascending: false,
      })
      .limit(100)

    if (error) {
      console.error(
        'Failed to load document versions:',
        error.message,
      )

      return NextResponse.json(
        { error: 'Unable to load version history.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
