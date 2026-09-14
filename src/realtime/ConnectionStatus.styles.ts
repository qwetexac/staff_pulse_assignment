import styled from 'styled-components'
import type { ConnectionStatus } from '@/realtime/types'

export const StatusRoot = styled.p<{ $status: ConnectionStatus }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  margin: 0;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.85rem;
  font-weight: 600;
`

export const StatusDot = styled.span<{ $status: ConnectionStatus }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $status }) => {
    if ($status === 'connected') {
      return theme.colors.performance.high
    }
    if ($status === 'reconnecting') {
      return theme.colors.warning
    }
    return theme.colors.danger
  }};
`
