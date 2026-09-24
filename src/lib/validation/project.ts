import { z } from 'zod'

import { SECURITY } from '@/lib/security/constants'

export const projectIdSchema = z.object({
  projectId: z.string().uuid(),
})

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(SECURITY.MAX_PROJECT_NAME_LENGTH),
  description: z.string().trim().max(2000).optional(),
})

export const sectionIdSchema = z.object({
  sectionId: z.string().uuid(),
})

export const createSectionSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().trim().min(1).max(SECURITY.MAX_SECTION_NAME_LENGTH),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
})
