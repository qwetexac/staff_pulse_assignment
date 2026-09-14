import { z } from 'zod'

export const OrgNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  parentId: z.string().nullable(),
  headcount: z.number().nonnegative(),
  budget: z.number().nonnegative(),
  performance: z.number().min(0).max(100),
  updatedAt: z.string().datetime(),
})

export const OrgTreeSchema = z.array(OrgNodeSchema)

export type OrgNode = z.infer<typeof OrgNodeSchema>
export type OrgTree = z.infer<typeof OrgTreeSchema>
