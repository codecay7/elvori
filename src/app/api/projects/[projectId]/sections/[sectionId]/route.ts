import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/require-user'
import { createClient } from '@/lib/supabase/server'
import { SECURITY } from '@/lib/security/constants'
import { handleApiError } from '@/lib/security/request'

type Props = {
  params: Promise<{
    projectId: string
    sectionId: string
  }>
}

const updateSectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(SECURITY.MAX_SECTION_NAME_LENGTH)
    .optional(),
  content: z
    .string()
    .max(SECURITY.MAX_LATEX_SIZE_BYTES)
    .optional(),
  position: z.number().int().min(0).max(1000).optional(),
})

export async function PATCH(
  request: Request,
  { params }: Props,
) {
  try {
    const user = await requireUser()
    const { projectId, sectionId } = await params

    const body = await request.json()
    const result = updateSectionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid section data.' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

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
      .from('document_sections')
      .update(result.data)
      .eq('id', sectionId)
      .eq('project_id', projectId)
      .select(
        'id, project_id, name, slug, content, position, created_at, updated_at',
      )
      .single()

    if (error) {
      console.error('Failed to update document section:', error.message)

      return NextResponse.json(
        { error: 'Unable to save document section.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    return handleApiError(error)
  }
}
