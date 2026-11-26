'use client';

import { useEffect } from 'react';

/**
 * Pauses looping CSS animations (scroll cue, slider sheen…) inside any element
 * marked `data-pause-offscreen` while it is out of view, so idle loops never
 * cost frames on parts of the page nobody can see.
 */
export default function OffscreenPause() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('[data-pause-offscreen]');
    if (!els.length || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) {
            delete el.dataset.offscreen;
            el.dataset.seen = ''; // lets sections defer decorative assets until first seen
          } else el.dataset.offscreen = '';
        });
      },
      { rootMargin: '100px 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
