'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsap';
import { scrollToTarget } from '@/lib/scroll';
import styles from './SlideToBook.module.css';

/**
 * "Slide To Book Your Ride" (Figma Group 2, 336 × 82): drag the white knob to the
 * end of the bronze track. Completing the slide glides the page to the inquiry form.
 */
export default function SlideToBook({ label }: { label: string }) {
  const track = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLButtonElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = track.current!;
    const k = knob.current!;
    let dragging = false;
    let startX = 0;
    let x = 0;
    const max = () => t.clientWidth - k.offsetWidth - k.offsetLeft * 2;

    const render = (v: number) => {
      const p = v / Math.max(max(), 1);
      gsap.set(k, { x: v });
      gsap.set(fill.current, { width: v + k.offsetWidth + k.offsetLeft });
      gsap.set(text.current, { opacity: 1 - p * 1.4, x: p * 30 });
    };

    const finish = () => {
      setDone(true);
      const o = { v: x };
      gsap.to(o, {
        v: max(),
        duration: 0.4,
        ease: 'power3.out',
        onUpdate: () => {
          x = o.v;
          render(x);
        },
        onComplete: () => {
          scrollToTarget('#contact');
          gsap.delayedCall(2.2, reset);
        },
      });
    };

    const reset = () => {
      setDone(false);
      const o = { v: x };
      gsap.to(o, {
        v: 0,
        duration: 1.2,
        ease: 'elastic.out(1, 0.6)',
        onUpdate: () => {
          x = o.v;
          render(x);
        },
      });
    };

    const down = (e: PointerEvent) => {
      dragging = true;
      startX = e.clientX - x;
      k.setPointerCapture(e.pointerId);
      gsap.to(k, { scale: 0.94, duration: 0.2 });
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      x = gsap.utils.clamp(0, max(), e.clientX - startX);
      render(x);
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      gsap.to(k, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
      if (x > max() * 0.82) {
        finish();
      } else {
        const o = { v: x };
        gsap.to(o, {
          v: 0,
          duration: 1,
          ease: 'elastic.out(1, 0.55)',
          onUpdate: () => {
            x = o.v;
            render(x);
          },
        });
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        finish();
      }
    };

    k.addEventListener('pointerdown', down);
    k.addEventListener('pointermove', move);
    k.addEventListener('pointerup', up);
    k.addEventListener('pointercancel', up);
    k.addEventListener('keydown', key);
    return () => {
      k.removeEventListener('pointerdown', down);
      k.removeEventListener('pointermove', move);
      k.removeEventListener('pointerup', up);
      k.removeEventListener('pointercancel', up);
      k.removeEventListener('keydown', key);
    };
  }, []);

  return (
    <div ref={track} className={styles.track} data-done={done || undefined}>
      <span ref={fill} className={styles.fill} aria-hidden />
      <span ref={text} className={styles.label} aria-hidden>
        {done ? 'Taking you there…' : label}
      </span>
      <button
        ref={knob}
        type="button"
        className={styles.knob}
        role="slider"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={done ? 100 : 0}
        data-cursor="drag"
        data-cursor-label="Slide"
      >
        <img width={33} height={33} src="/assets/hero/book-now-arrow.svg" alt="" draggable={false} />
      </button>
    </div>
  );
}
