'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { markIntroDone } from '@/lib/intro';
import styles from './Preloader.module.css';

/**
 * White loading screen: the NoirDrive mark draws in while a counter runs,
 * then everything dissolves in place (no sliding layers) to reveal the hero.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const html = document.documentElement;

      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);

      if (prefersReducedMotion()) {
        gsap.set(el, { autoAlpha: 0, display: 'none' });
        markIntroDone();
        return;
      }

      html.classList.add('is-loading');

      const counter = { v: 0 };
      const num = el.querySelector<HTMLElement>(`.${styles.count}`)!;
      const render = () => {
        num.textContent = String(Math.round(counter.v)).padStart(3, '0');
      };

      const ready = Promise.race([
        Promise.all([
          document.fonts?.ready ?? Promise.resolve(),
          new Promise<void>((res) => {
            if (document.readyState === 'complete') res();
            else window.addEventListener('load', () => res(), { once: true });
          }),
        ]),
        new Promise((res) => setTimeout(res, 2600)),
      ]);

      const intro = gsap.timeline();
      intro
        .fromTo(
          `.${styles.mark}`,
          { clipPath: 'inset(0% 100% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power3.inOut' },
          0.15,
        )
        .fromTo(`.${styles.rule}`, { scaleX: 0 }, { scaleX: 0.9, duration: 1.6, ease: 'power3.inOut' }, 0.1)
        .to(counter, { v: 90, duration: 1.6, ease: 'power3.inOut', onUpdate: render }, 0.1)
        .fromTo(`.${styles.meta}, .${styles.counter}`, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'sine.out' }, 0.1);

      let outro: gsap.core.Timeline | null = null;
      let cancelled = false;
      intro.eventCallback('onComplete', () => {
        ready.then(() => {
          if (cancelled) return;
          outro = gsap
            .timeline({
              onComplete: () => {
                gsap.set(el, { display: 'none' });
                html.classList.remove('is-loading');
              },
            })
            .to(counter, { v: 100, duration: 0.45, ease: 'power2.out', onUpdate: render })
            .to(`.${styles.rule}`, { scaleX: 1, duration: 0.45, ease: 'power2.out' }, '<')
            .to(`.${styles.center}, .${styles.meta}, .${styles.counter}`, {
              opacity: 0,
              scale: 0.985,
              duration: 0.6,
              ease: 'sine.inOut',
            }, '+=0.1')
            .add(() => markIntroDone(), '-=0.2')
            .to(el, { opacity: 0, duration: 0.9, ease: 'sine.inOut' }, '-=0.25');
        });
      });

      return () => {
        cancelled = true;
        outro?.kill();
        html.classList.remove('is-loading');
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className={styles.root} aria-hidden>
      <div className={styles.center}>
        <span className={styles.mark} />
        <span className={styles.rule} />
      </div>
      <div className={styles.meta}>
        <span>Luxury &amp; exotic car rental</span>
      </div>
      <div className={styles.counter}>
        <span className={styles.count}>000</span>
      </div>
    </div>
  );
}
