import { describe, expect, it } from 'vitest'
import { scrollTopToRevealRow } from '@/table/scrollRowIntoView'

describe('scrollTopToRevealRow', () => {
  it('pulls a row out from under the sticky header', () => {
    expect(
      scrollTopToRevealRow({
        scrollTop: 200,
        viewportHeight: 400,
        stickyHeaderHeight: 40,
        rowTop: 10,
        rowBottom: 48,
      }),
    ).toBe(170)
  })

  it('scrolls down when the row sits below the viewport', () => {
    expect(
      scrollTopToRevealRow({
        scrollTop: 0,
        viewportHeight: 400,
        stickyHeaderHeight: 40,
        rowTop: 380,
        rowBottom: 430,
      }),
    ).toBe(30)
  })

  it('does not move when the row is already fully visible below the header', () => {
    expect(
      scrollTopToRevealRow({
        scrollTop: 80,
        viewportHeight: 400,
        stickyHeaderHeight: 40,
        rowTop: 50,
        rowBottom: 90,
      }),
    ).toBe(80)
  })
})
