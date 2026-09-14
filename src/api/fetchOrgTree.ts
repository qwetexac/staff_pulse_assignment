import { API_BASE_URL } from '@/shared/constants'
import { ApiHttpError, ApiValidationError } from '@/api/errors'
import { OrgTreeSchema, type OrgTree } from '@/api/types'

export async function fetchOrgTree(signal?: AbortSignal): Promise<OrgTree> {
  const response = await fetch(`${API_BASE_URL}/api/org-tree`, { signal })

  if (!response.ok) {
    throw new ApiHttpError(
      response.status,
      `Failed to fetch org tree (HTTP ${response.status})`,
    )
  }

  const json: unknown = await response.json()
  const parsed = OrgTreeSchema.safeParse(json)

  if (!parsed.success) {
    throw new ApiValidationError(
      'Org tree response failed schema validation',
      parsed.error.issues,
    )
  }

  return parsed.data
}
