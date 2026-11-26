/**
 * Pixels per Figma design px (the root font-size / 10). Reading getComputedStyle
 * between DOM writes forces a full style recalculation each time, so the value
 * is read once and reused until the window resizes.
 */
let cached = 0;

if (typeof window !== 'undefined') {
  // Registered at import time, so it runs before any component's own resize handler.
  window.addEventListener('resize', () => {
    cached = 0;
  }, { passive: true });
}

export function remUnit() {
  if (!cached) cached = parseFloat(getComputedStyle(document.documentElement).fontSize) / 10;
  return cached;
}
