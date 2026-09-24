import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/security/request'

type RouteContext = {
  params: Promise<{
    projectId: string
    versionId: string
  }>
}

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  try {
    const user = await requireUser()
    const { projectId, versionId } = await context.params

    const supabase = await createClient()

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (projectError) {
      console.error('Restore project lookup failed:', projectError)

      return NextResponse.json(
        { error: 'Unable to restore version.' },
        { status: 500 },
      )
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found.' },
        { status: 404 },
      )
    }

    const { data, error } = await supabase.rpc(
      'restore_document_version',
      {
        p_project_id: projectId,
        p_version_id: versionId,
      },
    )

    if (error) {
      console.error('Document restore failed:', error)

      if (
        error.message.includes('version_not_found') ||
        error.message.includes('project_not_found')
      ) {
        return NextResponse.json(
          { error: 'Version not found.' },
          { status: 404 },
        )
      }

      if (error.message.includes('invalid_version_snapshot')) {
        return NextResponse.json(
          { error: 'The selected version is invalid.' },
          { status: 409 },
        )
      }

      if (error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized.' },
          { status: 401 },
        )
      }

      return NextResponse.json(
        { error: 'Unable to restore version.' },
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
