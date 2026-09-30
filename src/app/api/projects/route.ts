import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/require-user'
import { handleApiError } from '@/lib/security/request'
import { createProjectSchema } from '@/lib/validation/project'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_LATEX } from '@/lib/documents/default-latex'

export async function GET() {
  try {
    const user = await requireUser()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, status, created_at, updated_at')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Unable to load projects.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireUser()

    const body = await request.json()
    const result = createProjectSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid project data.' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc(
      'create_project_with_initial_section',
      {
        p_name: result.data.name,
        p_description: result.data.description ?? '',
        p_content: DEFAULT_LATEX,
      },
    )

    if (error) {
      return NextResponse.json(
        { error: 'Unable to create project.' },
        { status: 500 },
      )
    }

    const payload = data as {
      project?: {
        id: string
        name: string
        description: string | null
        status: string
        created_at: string
        updated_at: string
      }
      section?: {
        id: string
        name: string
        slug: string
        content: string
        position: number
        updated_at: string
      }
    }

    if (!payload.project?.id || !payload.section?.id) {
      return NextResponse.json(
        { error: 'Project creation returned an invalid result.' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        data: payload.project,
        section: payload.section,
      },
      { status: 201 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
