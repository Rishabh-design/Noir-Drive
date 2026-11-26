'use client';

import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap';

type Trigger = Element | string;
type Opts = { delay?: number; start?: string };

/**
 * Splitting text is layout-heavy and adds hundreds of nodes, so headings are split
 * lazily: hidden until they are about to scroll in, split just before the reveal,
 * and restored to plain text once it has played. Same animation, a lighter page.
 */
function lazyReveal(
  target: Element,
  trigger: Trigger,
  opts: Opts,
  split: (el: Element) => SplitText,
  animate: (s: SplitText, triggerOpts: ScrollTrigger.Vars) => gsap.core.Tween,
) {
  gsap.set(target, { visibility: 'hidden' });
  ScrollTrigger.create({
    trigger,
    start: 'top bottom+=200',
    end: 'max', // fire even if the page is already scrolled past the block
    once: true,
    onEnter: () => {
      const s = split(target);
      gsap.set(target, { visibility: 'visible' });
      const tween = animate(s, { trigger, start: opts.start ?? 'top 85%', once: true });
      tween.eventCallback('onComplete', () => s.revert());
    },
  });
}

/** Characters rise through a line mask, with a slight tilt that straightens as they land. */
export function revealChars(target: Element, trigger: Trigger = target, opts: Opts = {}) {
  lazyReveal(
    target,
    trigger,
    opts,
    (el) => SplitText.create(el, { type: 'lines,words,chars', mask: 'lines', linesClass: 'split-line' }),
    (s, scrollTrigger) =>
      gsap.from(s.chars, {
        yPercent: 115,
        rotate: 6,
        opacity: 0,
        duration: 1.3,
        delay: opts.delay ?? 0,
        stagger: { each: 0.018 },
        ease: 'noirOut',
        scrollTrigger,
      }),
  );
}

/** Whole lines slide up from behind their own mask — used for paragraphs. */
export function revealLines(target: Element, trigger: Trigger = target, opts: Opts = {}) {
  lazyReveal(
    target,
    trigger,
    { ...opts, start: opts.start ?? 'top 88%' },
    // Line splits keep words intact, so no aria rewrite is needed (aria-label isn't allowed on <p>).
    (el) => SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line', aria: 'none' }),
    (s, scrollTrigger) =>
      gsap.from(s.lines, {
        yPercent: 105,
        opacity: 0,
        duration: 1.2,
        delay: opts.delay ?? 0,
        stagger: 0.1,
        ease: 'noirOut',
        scrollTrigger,
      }),
  );
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
