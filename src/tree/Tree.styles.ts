import styled from 'styled-components'
import type { PerformanceLevel } from '@/tree/performance'

export const TreeList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`

export const TreeItem = styled.li`
  margin: 0;
`

export const NodeRow = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.sm};
  min-height: 40px;
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.sm};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.brandSoft : 'transparent'};

  &:hover {
    background: ${({ theme }) => theme.colors.background};
  }
`

export const ToggleButton = styled.button<{ $hidden?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  visibility: ${({ $hidden }) => ($hidden ? 'hidden' : 'visible')};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`

export const NodeSelectButton = styled.button`
  flex: 1;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`

export const Headcount = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-variant-numeric: tabular-nums;
  font-size: 0.92rem;
`

export const PerformanceDot = styled.span<{ $level: PerformanceLevel }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ theme, $level }) => theme.colors.performance[$level]};
`

export const ChildList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0 0 0 ${({ theme }) => theme.space.lg};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
  margin-left: 13px;
`
