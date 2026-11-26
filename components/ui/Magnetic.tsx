'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/gsap';

type Props = {
  children: React.ReactNode;
  /** How far (0–1) the element follows the pointer. */
  strength?: number;
  /** Optional inner element (selector) that moves further, for a parallax feel. */
  inner?: string;
  className?: string;
};

/** Pulls its child toward the pointer while hovered, then springs back. */
export default function Magnetic({ children, strength = 0.35, inner, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const innerEl = inner ? el.querySelector<HTMLElement>(inner) : null;
    const ixTo = innerEl ? gsap.quickTo(innerEl, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' }) : null;
    const iyTo = innerEl ? gsap.quickTo(innerEl, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' }) : null;

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      xTo(x * strength);
      yTo(y * strength);
      ixTo?.(x * strength * 0.5);
      iyTo?.(y * strength * 0.5);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
      ixTo?.(0);
      iyTo?.(0);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [strength, inner]);

  return (
    <span ref={ref} className={className} style={{ display: 'inline-block', willChange: 'transform' }}>
      {children}
    </span>
  );
}
