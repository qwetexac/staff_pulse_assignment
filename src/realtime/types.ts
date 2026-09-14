import { z } from 'zod'

export const OrgNodePatchSchema = z.object({
  id: z.string().min(1),
  headcount: z.number().nonnegative(),
  budget: z.number().nonnegative(),
  performance: z.number().min(0).max(100),
  updatedAt: z.string().datetime(),
})

export type OrgNodePatch = z.infer<typeof OrgNodePatchSchema>

export type OrgNodeMetrics = {
  headcount: number
  budget: number
  performance: number
}

export type AppliedOrgNodePatch = {
  revision: number
  nodeId: string
  previous: OrgNodeMetrics
  next: OrgNodeMetrics
  receivedAt: number
}

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'
