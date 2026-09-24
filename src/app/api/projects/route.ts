import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/require-user'
import { handleApiError } from '@/lib/security/request'
import { createProjectSchema } from '@/lib/validation/project'
import { createClient } from '@/lib/supabase/server'

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
    const user = await requireUser()

    const body = await request.json()
    const result = createProjectSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid project data.' },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('projects')
      .insert({
        owner_id: user.id,
        name: result.data.name,
        description: result.data.description ?? null,
      })
      .select('id, name, description, status, created_at, updated_at')
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Unable to create project.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
