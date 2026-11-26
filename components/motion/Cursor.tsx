'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';
import styles from './Cursor.module.css';

/**
 * Two-part cursor: a precise dot and a trailing ring. Elements opt in to
 * states with data attributes:
 *   data-cursor="hover"            ring swells over links and buttons (automatic for a, button)
 *   data-cursor="drag" | "view"    ring becomes a labelled disc
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine || !dot.current || !ring.current) return;
    document.documentElement.classList.add('has-cursor');

    // The dot is pinned to the pointer (no lag); the ring trails just enough to feel fluid.
    const dx = gsap.quickSetter(dot.current, 'x', 'px');
    const dy = gsap.quickSetter(dot.current, 'y', 'px');
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.16, ease: 'power2.out' });
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.16, ease: 'power2.out' });

    let shown = false;
    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY });
        gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.4 });
      }
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
    };

    let state = '';
    const setState = (next: string, text = '') => {
      if (next === state) return;
      state = next;
      const r = ring.current!;
      r.dataset.state = next;
      if (label.current) label.current.textContent = text;
    };

    const over = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const special = t.closest<HTMLElement>('[data-cursor]');
      if (special) {
        const kind = special.dataset.cursor || 'hover';
        setState(kind, kind === 'hover' ? '' : special.dataset.cursorLabel || kind);
        return;
      }
      if (t.closest('input, textarea')) return setState('text');
      if (t.closest('a, button, [role="button"], label')) return setState('hover');
      setState('');
    };

    const down = () => gsap.to(ring.current, { scale: 0.82, duration: 0.2, ease: 'power2.out' });
    const up = () => gsap.to(ring.current, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
    const leave = () => gsap.to([dot.current, ring.current], { autoAlpha: 0, duration: 0.3 });
    const enter = () => shown && gsap.to([dot.current, ring.current], { autoAlpha: 1, duration: 0.3 });

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    document.documentElement.addEventListener('pointerleave', leave);
    document.documentElement.addEventListener('pointerenter', enter);

    return () => {
      document.documentElement.classList.remove('has-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.documentElement.removeEventListener('pointerenter', enter);
    };
  }, []);

  return (
    <>
      <div ref={ring} className={styles.ring} aria-hidden>
        <span ref={label} className={styles.label} />
      </div>
      <div ref={dot} className={styles.dot} aria-hidden />
    </>
  );
}
