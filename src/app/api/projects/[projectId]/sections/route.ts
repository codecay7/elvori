import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { SECURITY } from '@/lib/security/constants'
import { handleApiError } from '@/lib/security/request'
import { z } from 'zod'

type Props = {
  params: Promise<{
    projectId: string
  }>
}

const sectionSchema = z.object({
  name: z.string().trim().min(1).max(SECURITY.MAX_SECTION_NAME_LENGTH),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().max(SECURITY.MAX_LATEX_SIZE_BYTES),
  position: z.number().int().min(0).max(1000),
})

async function verifyProjectOwnership(
  projectId: string,
  userId: string,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('owner_id', userId)
    .maybeSingle()

  if (error || !data) {
    return false
  }

  return true
}

export async function GET(
  _request: Request,
  { params }: Props,
) {
  try {
    const user = await requireUser()
    const { projectId } = await params

    if (!(await verifyProjectOwnership(projectId, user.id))) {
      return NextResponse.json(
        { error: 'Project not found.' },
        { status: 404 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('document_sections')
      .select(
        'id, project_id, name, slug, content, position, created_at, updated_at',
      )
      .eq('project_id', projectId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Failed to load document sections:', error.message)

      return NextResponse.json(
        { error: 'Unable to load document sections.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(
  request: Request,
  { params }: Props,
) {
  try {
    const user = await requireUser()
    const { projectId } = await params

    if (!(await verifyProjectOwnership(projectId, user.id))) {
      return NextResponse.json(
        { error: 'Project not found.' },
        { status: 404 },
      )
    }

    const body = await request.json()
    const result = sectionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid section data.' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('document_sections')
      .insert({
        project_id: projectId,
        name: result.data.name,
        slug: result.data.slug,
        content: result.data.content,
        position: result.data.position,
      })
      .select(
        'id, project_id, name, slug, content, position, created_at, updated_at',
      )
      .single()

    if (error) {
      console.error('Failed to create document section:', error.message)

      return NextResponse.json(
        { error: 'Unable to create document section.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
