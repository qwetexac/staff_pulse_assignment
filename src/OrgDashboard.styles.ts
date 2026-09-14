import styled from 'styled-components'
import {
  PANE_BODY_MAX_HEIGHT,
  SPLIT_VIEW_MIN_WIDTH_PX,
} from '@/shared/constants'

const splitView = `@media (min-width: ${SPLIT_VIEW_MIN_WIDTH_PX}px)`

export const DashboardRoot = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
`

export const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space.md};
`

export const ViewToggle = styled.div`
  display: inline-flex;
  padding: 3px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};

  ${splitView} {
    display: none;
  }
`

export const ViewToggleButton = styled.button<{ $active?: boolean }>`
  padding: ${({ theme }) => theme.space.xs} ${({ theme }) => theme.space.md};
  border: 0;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.brandSoft : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.brand : theme.colors.text};
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`

export const Hint = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9rem;

  ${splitView} {
    display: none;
  }
`

export const Split = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space.lg};
  grid-template-columns: 1fr;
  align-items: stretch;

  ${splitView} {
    grid-template-columns: minmax(280px, 0.85fr) minmax(0, 1.35fr);
  }
`

export const Pane = styled.section<{ $visibleOnNarrow: boolean }>`
  display: ${({ $visibleOnNarrow }) => ($visibleOnNarrow ? 'flex' : 'none')};
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadow};
  padding: ${({ theme }) => theme.space.lg};

  ${splitView} {
    display: flex;
    height: ${PANE_BODY_MAX_HEIGHT};
  }
`

export const PaneTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space.md};
  font-size: 1rem;
  font-weight: 600;
`

export const TreeScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  max-height: ${PANE_BODY_MAX_HEIGHT};

  ${splitView} {
    max-height: none;
  }
`
