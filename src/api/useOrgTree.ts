import { useCallback } from 'react'
import { fetchOrgTree } from '@/api'
import { useQueryCache } from '@/cache'
import { ORG_TREE_QUERY_KEY } from '@/shared/constants'

export function useOrgTree() {
  const queryFn = useCallback(
    (signal: AbortSignal) => fetchOrgTree(signal),
    [],
  )

  return useQueryCache({
    queryKey: ORG_TREE_QUERY_KEY,
    queryFn,
  })
}
