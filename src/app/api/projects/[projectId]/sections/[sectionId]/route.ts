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
  content: z
    .string()
    .max(SECURITY.MAX_LATEX_SIZE_BYTES),
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

    /*
     * The database function performs:
     *
     * authentication
     * ownership verification
     * section verification
     * section update
     * complete snapshot
     * version creation
     *
     * inside one transaction.
     */
    const { data, error } = await supabase.rpc(
      'save_document_section',
      {
        p_project_id: projectId,
        p_section_id: sectionId,
        p_content: result.data.content,
      },
    )

    if (error) {
      console.error(
        'Failed to save document section:',
        error.message,
      )

      if (error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized.' },
          { status: 401 },
        )
      }

      if (error.message.includes('project_not_found')) {
        return NextResponse.json(
          { error: 'Project not found.' },
          { status: 404 },
        )
      }

      if (error.message.includes('section_not_found')) {
        return NextResponse.json(
          { error: 'Section not found.' },
          { status: 404 },
        )
      }

      return NextResponse.json(
        { error: 'Unable to save document.' },
        { status: 500 },
      )
    }

    /*
     * Prevent unused-variable lint issues while keeping
     * authentication explicitly enforced at the API layer.
     */
    void user

    return NextResponse.json({
      data,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
