'use client';

import { useEffect, useRef } from 'react';
import styles from './Cursor.module.css';

/**
 * Two-part cursor: a dot pinned exactly to the pointer and a ring that follows
 * on a short, frame-rate-independent ease (≈0.13s to settle) — fluid, not laggy.
 *
 * Elements opt in to states with data attributes:
 *   data-cursor="hover"            ring swells over links and buttons (automatic for a, button)
 *   data-cursor="drag" | "view"    ring becomes a labelled disc
 *
 * Performance: one rAF loop that sleeps once the ring has caught up; transforms only
 * (no layout, no blend modes, no backdrop blur).
 */
const FOLLOW = 0.045; // seconds — ring time constant

export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const d = dot.current;
    const r = ring.current;
    if (!fine || !d || !r) return;
    document.documentElement.classList.add('has-cursor');

    let tx = 0;
    let ty = 0;
    let rx = 0;
    let ry = 0;
    let raf = 0;
    let last = 0;
    let shown = false;

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const k = 1 - Math.exp(-dt / FOLLOW);
      rx += (tx - rx) * k;
      ry += (ty - ry) * k;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      if (Math.abs(tx - rx) + Math.abs(ty - ry) > 0.1) raf = requestAnimationFrame(tick);
      else raf = 0;
    };

    const move = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      d.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      if (!shown) {
        shown = true;
        rx = tx;
        ry = ty;
        r.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        document.documentElement.classList.add('cursor-visible');
      }
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    let state = '';
    const setState = (next: string, text = '') => {
      if (next === state) return;
      state = next;
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

    const down = () => r.classList.add(styles.pressed);
    const up = () => r.classList.remove(styles.pressed);
    const leave = () => document.documentElement.classList.remove('cursor-visible');
    const enter = () => shown && document.documentElement.classList.add('cursor-visible');

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    document.documentElement.addEventListener('pointerenter', enter);

    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor', 'cursor-visible');
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
        <span className={styles.ringShape} />
        <span ref={label} className={styles.label} />
      </div>
      <div ref={dot} className={styles.dot} aria-hidden />
    </>
  );
}
