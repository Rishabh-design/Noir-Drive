'use client';

import { gsap, SplitText } from '@/lib/gsap';

type Trigger = Element | string;

/** Characters rise through a line mask, with a slight tilt that straightens as they land. */
export function revealChars(target: Element, trigger: Trigger = target, opts: { delay?: number; start?: string } = {}) {
  return SplitText.create(target, {
    type: 'lines,words,chars',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    onSplit(self) {
      return gsap.from(self.chars, {
        yPercent: 115,
        rotate: 6,
        opacity: 0,
        duration: 1.3,
        delay: opts.delay ?? 0,
        stagger: { each: 0.018 },
        ease: 'noirOut',
        scrollTrigger: { trigger, start: opts.start ?? 'top 85%', once: true },
      });
    },
  });
}

/** Whole lines slide up from behind their own mask — used for paragraphs. */
export function revealLines(target: Element, trigger: Trigger = target, opts: { delay?: number; start?: string } = {}) {
  return SplitText.create(target, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    linesClass: 'split-line',
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 105,
        opacity: 0,
        duration: 1.2,
        delay: opts.delay ?? 0,
        stagger: 0.1,
        ease: 'noirOut',
        scrollTrigger: { trigger, start: opts.start ?? 'top 88%', once: true },
      });
    },
  });
}

/** Eyebrow rules draw outwards from the label, label fades up. */
export function revealEyebrow(root: Element, opts: { start?: string; delay?: number } = {}) {
  const lines = root.querySelectorAll('[data-eyebrow-line]');
  const label = root.querySelector('[data-eyebrow-label]');
  const tl = gsap.timeline({
    delay: opts.delay ?? 0,
    scrollTrigger: { trigger: root, start: opts.start ?? 'top 88%', once: true },
  });
  tl.from(lines, { scaleX: 0, duration: 1.4, ease: 'noir' }, 0);
  if (label) tl.from(label, { yPercent: 100, opacity: 0, letterSpacing: '0.4em', duration: 1.2, ease: 'noirOut' }, 0.1);
  return tl;
}
