'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { markIntroDone } from '@/lib/intro';
import styles from './Preloader.module.css';

/**
 * Opening curtain: the NoirDrive mark is drawn in while a counter runs,
 * then the curtain lifts and hands over to the hero entrance.
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
        .set(el, { autoAlpha: 1 })
        .fromTo(
          `.${styles.mark}`,
          { clipPath: 'inset(0% 100% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'noir' },
          0.15,
        )
        .fromTo(`.${styles.rule}`, { scaleX: 0 }, { scaleX: 0.9, duration: 1.6, ease: 'noir' }, 0.1)
        .to(counter, { v: 90, duration: 1.6, ease: 'noir', onUpdate: render }, 0.1)
        .fromTo(
          `.${styles.meta} > *`,
          { yPercent: 120 },
          { yPercent: 0, stagger: 0.08, duration: 1, ease: 'noirOut' },
          0.2,
        );

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
            .to(`.${styles.meta} > *`, { yPercent: -120, stagger: 0.05, duration: 0.6, ease: 'noir' }, '+=0.05')
            .to(`.${styles.mark}`, { yPercent: -30, autoAlpha: 0, duration: 0.7, ease: 'noir' }, '<')
            .to(`.${styles.rule}`, { scaleX: 0, transformOrigin: '100% 50%', duration: 0.6, ease: 'noir' }, '<')
            .add(() => markIntroDone(), '-=0.15')
            .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'noir' }, '-=0.3');
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
        <img className={styles.mark} src="/assets/brand/logo.svg" alt="" width={219} height={23} />
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
