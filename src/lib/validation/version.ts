import { z } from 'zod'

const uuidSchema = z.string().uuid()

export const versionIdSchema = z.object({
  versionId: uuidSchema,
})

export const versionSnapshotSectionSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(120),
  content: z.string(),
  position: z.number().int().nonnegative(),
})

export const versionSnapshotSchema = z.object({
  sections: z.array(versionSnapshotSectionSchema),
})

export type VersionSnapshot = z.infer<typeof versionSnapshotSchema>
