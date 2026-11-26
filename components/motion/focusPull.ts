'use client';

import { gsap } from '@/lib/gsap';

/**
 * Camera-style focus pull for the depth carousels (fleet, client stories).
 *
 * Each card's blur lives in its own number and is written to `filter` on every
 * frame, so the radius changes continuously instead of being re-parsed from a
 * CSS string. Sharpening uses an ease-out that lingers in the low range —
 * soft, softer, barely soft, crisp — and finishes a little after the card lands.
 * At 0 the filter is removed entirely so text renders perfectly sharp.
 */
export type Blur = { v: number };

export function applyBlur(el: HTMLElement, b: Blur) {
  el.style.filter = b.v < 0.05 ? 'none' : `blur(${b.v.toFixed(2)}px)`;
}

export function setBlur(el: HTMLElement, b: Blur, v: number) {
  gsap.killTweensOf(b);
  b.v = v;
  applyBlur(el, b);
}

export function focusPull(
  tl: gsap.core.Timeline,
  el: HTMLElement,
  b: Blur,
  target: number,
  at = 0,
  reduce = false,
) {
  const sharpening = target < b.v;
  tl.to(
    b,
    {
      v: target,
      duration: reduce ? 0.01 : sharpening ? 1.9 : 1.3,
      ease: sharpening ? 'power2.out' : 'sine.inOut',
      overwrite: true,
      onUpdate: () => applyBlur(el, b),
    },
    at,
  );
}
