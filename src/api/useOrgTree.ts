import { useCallback } from 'react'
import { fetchOrgTree } from '@/api'
import { useQueryCache } from '@/cache'
import { CACHE_STALE_TIME_MS, ORG_TREE_QUERY_KEY } from '@/shared/constants'

export function useOrgTree(options?: { staleTime?: number }) {
  const queryFn = useCallback(
    (signal: AbortSignal) => fetchOrgTree(signal),
    [],
  )

  return useQueryCache({
    queryKey: ORG_TREE_QUERY_KEY,
    queryFn,
    staleTime: options?.staleTime ?? CACHE_STALE_TIME_MS,
  })
}
