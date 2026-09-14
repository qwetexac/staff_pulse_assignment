import { useEffect, useRef, useState } from 'react'
import { fetchOrgTree } from '@/api'
import { queryCacheStore } from '@/cache/queryCacheStore'
import {
  ORG_TREE_QUERY_KEY,
  REALTIME_BACKOFF_FACTOR,
  REALTIME_BACKOFF_INITIAL_MS,
  REALTIME_BACKOFF_MAX_MS,
  REALTIME_URL,
} from '@/shared/constants'
import { applyOrgNodePatch } from '@/realtime/applyOrgNodePatch'
import { nextReconnectDelayMs } from '@/realtime/connectionBackoff'
import { OrgNodePatchSchema } from '@/realtime/types'
import type { AppliedOrgNodePatch, ConnectionStatus } from '@/realtime/types'
import type { OrgNode } from '@/api/types'

type UseOrgTreeStreamResult = {
  status: ConnectionStatus
  lastPatch: AppliedOrgNodePatch | null
}

function patchCachedTree(patch: ReturnType<typeof OrgNodePatchSchema.parse>) {
  return queryCacheStore.patchData(ORG_TREE_QUERY_KEY, (nodes: OrgNode[]) =>
    applyOrgNodePatch(nodes, patch),
  )
}

export function useOrgTreeStream(): UseOrgTreeStreamResult {
  const [status, setStatus] = useState<ConnectionStatus>('reconnecting')
  const [lastPatch, setLastPatch] = useState<AppliedOrgNodePatch | null>(null)
  const patchRevisionRef = useRef(0)
  const openedOnceRef = useRef(false)

  useEffect(() => {
    let stopped = false
    let source: EventSource | null = null
    let reconnectTimer: number | null = null
    let failedAttempts = 0

    const clearReconnectTimer = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
    }

    const closeSource = () => {
      if (source) {
        source.close()
        source = null
      }
    }

    const connect = () => {
      if (stopped) {
        return
      }

      closeSource()
      source = new EventSource(REALTIME_URL)

      source.onopen = () => {
        if (stopped) {
          return
        }

        failedAttempts = 0
        setStatus('connected')

        if (openedOnceRef.current) {
          void queryCacheStore
            .revalidate(ORG_TREE_QUERY_KEY, (signal) => fetchOrgTree(signal))
            .catch(() => {
              // Keep showing last data; the stream is already open.
            })
        }
        openedOnceRef.current = true
      }

      source.onmessage = (event) => {
        if (stopped) {
          return
        }

        let json: unknown
        try {
          json = JSON.parse(event.data) as unknown
        } catch {
          return
        }

        const parsed = OrgNodePatchSchema.safeParse(json)
        if (!parsed.success) {
          return
        }

        const applied = patchCachedTree(parsed.data)
        if (!applied) {
          return
        }

        patchRevisionRef.current += 1
        setLastPatch({
          ...applied,
          revision: patchRevisionRef.current,
          receivedAt: Date.now(),
        })
      }

      source.onerror = () => {
        closeSource()
        if (stopped) {
          return
        }

        setStatus('disconnected')
        const delay = nextReconnectDelayMs(
          failedAttempts,
          REALTIME_BACKOFF_INITIAL_MS,
          REALTIME_BACKOFF_MAX_MS,
          REALTIME_BACKOFF_FACTOR,
        )
        failedAttempts += 1
        clearReconnectTimer()
        reconnectTimer = window.setTimeout(() => {
          if (stopped) {
            return
          }
          setStatus('reconnecting')
          connect()
        }, delay)
      }
    }

    connect()

    return () => {
      stopped = true
      clearReconnectTimer()
      closeSource()
    }
  }, [])

  return { status, lastPatch }
}
