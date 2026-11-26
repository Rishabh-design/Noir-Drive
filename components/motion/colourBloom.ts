'use client';

import type React from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';

/**
 * Colour bloom.
 *
 * A photo shows in the site's muted grade. On hover the full-colour original,
 * stacked above it, is revealed through a soft-edged circle that grows from the
 * exact point where the pointer came in. A faint warm light travels on its
 * leading edge, like a print coming up in the developer. Nothing moves: not
 * the frame and not the photo. Only the colour travels through the image. On
 * leave the colour drains back out towards the point where the pointer left.
 *
 * Markup: a `face` element (Bloom.module.css `.face`) holding the muted photo,
 * then a `.colour` layer with the original, then a `.light` layer. The state
 * lives in CSS variables on the face (--bx, --by, --br, --bf and --bring). Only
 * those two layers repaint while a bloom runs, and both are hidden when idle.
 */
type State = { x: number; y: number; r: number; ring: number; full: number; tl?: gsap.core.Timeline; timer?: gsap.core.Tween };

const states = new WeakMap<HTMLElement, State>();
const stateOf = (face: HTMLElement) => {
  let s = states.get(face);
  if (!s) states.set(face, (s = { x: 0, y: 0, r: 0, ring: 0, full: 0 }));
  return s;
};

/** Soft edge: a fifth of the photo's longer side (≈ 14rem on a desktop fleet card). */
const featherOf = (face: HTMLElement) => Math.max(face.offsetWidth, face.offsetHeight) * 0.2;

function write(face: HTMLElement, s: State) {
  const st = face.style;
  st.setProperty('--bx', `${s.x.toFixed(1)}px`);
  st.setProperty('--by', `${s.y.toFixed(1)}px`);
  st.setProperty('--br', `${s.r.toFixed(1)}px`);
  st.setProperty('--bring', s.ring.toFixed(3));
  if (s.r > 0.5) face.setAttribute('data-bloom', '');
  else face.removeAttribute('data-bloom');
}

/** Radius that covers the whole face from (x, y), including the soft edge. */
function reach(face: HTMLElement, x: number, y: number) {
  const w = face.offsetWidth;
  const h = face.offsetHeight;
  return Math.hypot(Math.max(x, w - x), Math.max(y, h - y)) + featherOf(face);
}

/**
 * Pointer position in the face's own (untransformed) coordinates. Pass the
 * rotating/scaling parent as `pose` when the face is tilted (the fleet cards);
 * otherwise the bounding box is enough (translation and scale only).
 */
export function localPoint(face: HTMLElement, clientX: number, clientY: number, pose?: HTMLElement) {
  const box = face.getBoundingClientRect();
  const w = face.offsetWidth;
  const h = face.offsetHeight;
  let x: number;
  let y: number;
  if (pose) {
    const dx = clientX - (box.left + box.width / 2);
    const dy = clientY - (box.top + box.height / 2);
    const a = (-(Number(gsap.getProperty(pose, 'rotation')) || 0) * Math.PI) / 180;
    const k = Number(gsap.getProperty(pose, 'scaleX')) || 1;
    x = (dx * Math.cos(a) - dy * Math.sin(a)) / k + w / 2;
    y = (dx * Math.sin(a) + dy * Math.cos(a)) / k + h / 2;
  } else {
    x = ((clientX - box.left) / (box.width || 1)) * w;
    y = ((clientY - box.top) / (box.height || 1)) * h;
  }
  return { x: gsap.utils.clamp(0, w, x), y: gsap.utils.clamp(0, h, y) };
}

export function bloomIn(face: HTMLElement, x: number, y: number) {
  const s = stateOf(face);
  const reduce = prefersReducedMotion();
  s.tl?.kill();
  s.timer?.kill();
  // A fresh bloom starts where the pointer came in; one already under way keeps its centre.
  if (s.r <= 0.5) {
    s.x = x;
    s.y = y;
  }
  face.style.setProperty('--bf', `${featherOf(face).toFixed(1)}px`);
  s.full = reach(face, s.x, s.y);
  const tl = gsap.timeline({ onUpdate: () => write(face, s) });
  tl.to(s, { r: s.full, duration: reduce ? 0.01 : 1.45, ease: 'power2.out' }, 0);
  if (!reduce) {
    tl.to(s, { ring: 1, duration: 0.4, ease: 'sine.out' }, 0);
    tl.to(s, { ring: 0, duration: 0.85, ease: 'sine.inOut' }, 0.6);
  }
  s.tl = tl;
}

export function bloomOut(face: HTMLElement, exit?: { x: number; y: number }) {
  const s = stateOf(face);
  const reduce = prefersReducedMotion();
  s.tl?.kill();
  s.timer?.kill();
  if (s.r <= 0.5) return;
  // Fully coloured: move the centre to the exit point at full reach (no visible change),
  // so the colour drains away towards where the pointer left.
  if (exit && s.r >= s.full - 1) {
    s.x = exit.x;
    s.y = exit.y;
    s.r = s.full = reach(face, exit.x, exit.y);
  }
  const tl = gsap.timeline({ onUpdate: () => write(face, s) });
  tl.to(s, { r: 0, duration: reduce ? 0.01 : 1.1, ease: 'power2.inOut' }, 0);
  if (reduce) tl.set(s, { ring: 0 }, 0);
  else tl.to(s, { ring: 0.55, duration: 0.35, ease: 'sine.out' }, 0).to(s, { ring: 0, duration: 0.55, ease: 'sine.in' }, 0.45);
  s.tl = tl;
}

/** Touch screens have no hover: bloom from the middle (used when a photo settles in view). */
export function bloomCentre(face: HTMLElement) {
  bloomIn(face, face.offsetWidth / 2, face.offsetHeight / 2);
}

/**
 * React pointer handlers for a face. Mouse: bloom on enter, drain on leave.
 * Touch/pen (`tap: true`): a tap blooms from the finger and drains after a beat.
 */
export function bloomHandlers(opts: { pose?: () => HTMLElement | undefined; tap?: boolean } = {}) {
  const at = (e: React.PointerEvent<HTMLElement>) => localPoint(e.currentTarget, e.clientX, e.clientY, opts.pose?.());
  return {
    onPointerEnter: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return;
      const p = at(e);
      bloomIn(e.currentTarget, p.x, p.y);
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return;
      bloomOut(e.currentTarget, at(e));
    },
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (!opts.tap || e.pointerType === 'mouse') return;
      const face = e.currentTarget;
      const p = at(e);
      bloomIn(face, p.x, p.y);
      stateOf(face).timer = gsap.delayedCall(2.6, () => bloomOut(face));
    },
  };
}
