/**
 * Run work when the main thread is idle (falls back to a short timeout where
 * requestIdleCallback isn't available, e.g. Safari). Returns a cancel function.
 *
 * Used to set up below-the-fold animations in their own small tasks instead of
 * inside the one long hydration task — the page becomes responsive sooner.
 */
export function whenIdle(fn: () => void, timeout = 1500) {
  if (typeof window === 'undefined') return () => {};
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = setTimeout(fn, 60);
  return () => clearTimeout(id);
}
