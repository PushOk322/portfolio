/**
 * Portfolio build: no-op.
 *
 * The production game ran inside Telegram and drove the host's native back button
 * (`window.Telegram.WebApp.BackButton`). Outside Telegram that object does not exist,
 * so the original threw on load. Kept as a function rather than deleted so the call
 * sites still read the way they did in the real app.
 */
export const showBackButton = (): void => {
  // Nothing to show: the demo has no host chrome to drive.
}
