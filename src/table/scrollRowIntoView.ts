/**
 * New `scrollTop` so `row` sits fully in the viewport below a sticky header.
 * Positions are relative to the scrollport (0 = top of the visible box).
 */
export function scrollTopToRevealRow(options: {
  scrollTop: number
  viewportHeight: number
  stickyHeaderHeight: number
  rowTop: number
  rowBottom: number
}): number {
  const {
    scrollTop,
    viewportHeight,
    stickyHeaderHeight,
    rowTop,
    rowBottom,
  } = options

  if (rowTop < stickyHeaderHeight) {
    return scrollTop + (rowTop - stickyHeaderHeight)
  }

  if (rowBottom > viewportHeight) {
    return scrollTop + (rowBottom - viewportHeight)
  }

  return scrollTop
}

export function scrollRowIntoTableView(
  scrollParent: HTMLElement,
  row: HTMLElement,
  stickyHeader: HTMLElement | null,
): void {
  const parentRect = scrollParent.getBoundingClientRect()
  const rowRect = row.getBoundingClientRect()
  const headerRect = stickyHeader?.getBoundingClientRect()
  const stickyHeaderHeight = headerRect
    ? headerRect.bottom - parentRect.top
    : 0

  scrollParent.scrollTop = scrollTopToRevealRow({
    scrollTop: scrollParent.scrollTop,
    viewportHeight: parentRect.height,
    stickyHeaderHeight,
    rowTop: rowRect.top - parentRect.top,
    rowBottom: rowRect.bottom - parentRect.top,
  })
}
