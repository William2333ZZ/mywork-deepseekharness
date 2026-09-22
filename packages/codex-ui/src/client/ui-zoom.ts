/**
 * dsh-mywork-shell scales the app root with CSS `zoom` (--mywork-zoom on <html>, applied to #root).
 * Pointer coordinates stay in viewport px, so a drag delta must be divided by the zoom factor before
 * it is applied to a CSS-px width. 1 when no zoom is active.
 */
export function uiZoom(): number {
  const root = document.getElementById('root')
  const value = root === null ? 1 : parseFloat(getComputedStyle(root).zoom)
  return Number.isFinite(value) && value > 0 ? value : 1
}

/** Map a viewport-px pointer X to the CSS-px coordinate space of the zoomed root, keeping `startX` fixed. */
export function zoomedDeltaX(startX: number, currentX: number): number {
  return startX + (currentX - startX) / uiZoom()
}
