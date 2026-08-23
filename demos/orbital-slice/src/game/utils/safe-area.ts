/**
 * Content safe-area inset.
 *
 * Inside Telegram this is the strip the host's own header occupies, and the game used
 * to read `window.Telegram.WebApp.contentSafeAreaInset` directly. Outside Telegram that
 * object does not exist, so the read threw at module-evaluation time and took the whole
 * bundle down before Phaser ever booted.
 *
 * There is no host chrome in a browser tab, so the honest value is 0 — but the lookup
 * stays dynamic rather than hardcoded, so the same code still works if this is ever
 * embedded in a Mini App again.
 */
export function contentSafeAreaTop(): number {
  return window.Telegram?.WebApp?.contentSafeAreaInset?.top ?? 0
}
