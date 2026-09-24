import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { handleApiError } from '@/lib/security/request'
import { versionIdSchema, versionSnapshotSchema } from '@/lib/validation/version'

type RouteContext = {
  params: Promise<{
    projectId: string
    versionId: string
  }>
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const user = await requireUser()
    const { projectId, versionId } = await context.params

    const parsed = versionIdSchema.safeParse({ versionId })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid version ID.' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('owner_id', user.id)
      .maybeSingle()

    if (projectError) {
      console.error('Version project lookup failed:', projectError)
      return NextResponse.json(
        { error: 'Unable to load version.' },
        { status: 500 },
      )
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found.' },
        { status: 404 },
      )
    }

    const { data: version, error: versionError } = await supabase
      .from('document_versions')
      .select(
        'id, project_id, version_number, snapshot, created_by, created_at',
      )
      .eq('id', versionId)
      .eq('project_id', projectId)
      .maybeSingle()

    if (versionError) {
      console.error('Version lookup failed:', versionError)
      return NextResponse.json(
        { error: 'Unable to load version.' },
        { status: 500 },
      )
    }

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found.' },
        { status: 404 },
      )
    }

    const snapshot = versionSnapshotSchema.safeParse(version.snapshot)

    if (!snapshot.success) {
      console.error('Invalid stored version snapshot:', snapshot.error)
      return NextResponse.json(
        { error: 'Stored version is invalid.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      data: {
        id: version.id,
        projectId: version.project_id,
        versionNumber: version.version_number,
        createdBy: version.created_by,
        createdAt: version.created_at,
        snapshot: snapshot.data,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
