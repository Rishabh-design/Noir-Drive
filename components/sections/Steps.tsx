'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { steps } from '@/content/site';
import { revealChars } from '@/components/motion/reveal';
import SlideToBook from '@/components/ui/SlideToBook';
import clsx from '@/lib/clsx';
import styles from './Steps.module.css';

const STEP_MS = 6;
// Each step re-frames the same photograph — a slow camera move between shots.
const FRAMES = [
  { scale: 1, xPercent: 0, yPercent: 0 },
  { scale: 1.42, xPercent: -14, yPercent: -6 },
  { scale: 1.22, xPercent: 9, yPercent: 7 },
];

/** "Three Simple Steps" — auto-advancing accordion beside a re-framing photograph. */
export default function Steps() {
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(0);
  const inView = useRef(false);
  const timer = useRef<gsap.core.Tween | null>(null);
  const hovering = useRef(false);

  // Expand / collapse bodies and move the camera whenever the open step changes.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = prefersReducedMotion();
    el.querySelectorAll<HTMLElement>('[data-step-body]').forEach((body, i) => {
      gsap.to(body, {
        height: i === open ? 'auto' : 0,
        opacity: i === open ? 1 : 0,
        duration: reduce ? 0 : 0.9,
        ease: 'noir',
        overwrite: 'auto',
      });
    });
    gsap.to(el.querySelector('[data-step-photo]'), {
      ...FRAMES[open],
      duration: reduce ? 0 : 2.2,
      ease: 'noir',
      overwrite: 'auto',
    });
  }, [open]);

  // Progress bar on the open step; when it fills, move on.
  const runTimer = useCallback((index: number) => {
    timer.current?.kill();
    const bar = root.current?.querySelectorAll<HTMLElement>('[data-step-progress]')[index];
    if (!bar) return;
    root.current?.querySelectorAll<HTMLElement>('[data-step-progress]').forEach((b) => gsap.set(b, { scaleX: 0 }));
    if (!inView.current || prefersReducedMotion()) return;
    timer.current = gsap.to(bar, {
      scaleX: 1,
      duration: STEP_MS,
      ease: 'none',
      onComplete: () => setOpen((o) => (o + 1) % steps.items.length),
    });
    if (hovering.current) timer.current.pause();
  }, []);

  useEffect(() => {
    runTimer(open);
  }, [open, runTimer]);

  useEffect(() => {
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 60%',
      end: 'bottom 20%',
      onToggle: (self) => {
        inView.current = self.isActive;
        if (self.isActive) runTimer(open);
        else timer.current?.pause();
      },
    });
    return () => {
      st.kill();
      timer.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runTimer]);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      revealChars(q('[data-steps-title]')[0], root.current!, { start: 'top 70%' });
      if (prefersReducedMotion()) return;

      gsap.from(q('[data-step]'), {
        y: 50,
        opacity: 0,
        duration: 1.2,
        stagger: 0.12,
        scrollTrigger: { trigger: q('[data-steps-list]')[0], start: 'top 85%', once: true },
      });
      gsap.from(q('[data-step-rule]'), {
        scaleX: 0,
        duration: 1.6,
        ease: 'noir',
        stagger: 0.15,
        scrollTrigger: { trigger: q('[data-steps-list]')[0], start: 'top 85%', once: true },
      });
      gsap.from(q('[data-steps-slider]'), {
        x: -40,
        opacity: 0,
        duration: 1.3,
        scrollTrigger: { trigger: q('[data-steps-slider]')[0], start: 'top 95%', once: true },
      });

      // The photograph unveils from the bottom, then drifts against the scroll.
      gsap.fromTo(
        q('[data-steps-media]'),
        { clipPath: 'inset(100% 0% 0% 0% round 2.291rem)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 2.291rem)',
          duration: 1.8,
          ease: 'noir',
          scrollTrigger: { trigger: q('[data-steps-media]')[0], start: 'top 80%', once: true },
        },
      );
      gsap.fromTo(
        q('[data-steps-parallax]'),
        { yPercent: -7 },
        {
          yPercent: 7,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} id="steps" className={styles.steps}>
      <div className={styles.frame}>
        <div className={styles.row}>
          <div className={styles.left}>
            <h2 className={styles.title} data-steps-title>
              {steps.title}
            </h2>

            <ol
              className={styles.list}
              data-steps-list
              onPointerEnter={() => {
                hovering.current = true;
                timer.current?.pause();
              }}
              onPointerLeave={() => {
                hovering.current = false;
                if (inView.current) timer.current?.resume();
              }}
            >
              {steps.items.map((item, i) => {
                const isOpen = i === open;
                return (
                  <li key={item.n} className={styles.itemWrap}>
                    {i > 0 && (
                      <span className={styles.rule} data-step-rule aria-hidden>
                        <img src="/assets/steps/divider.svg" alt="" />
                      </span>
                    )}
                    <div className={clsx(styles.item, isOpen && styles.isOpen)} data-step>
                      <button
                        type="button"
                        className={styles.head}
                        aria-expanded={isOpen}
                        aria-controls={`step-${i}`}
                        onClick={() => setOpen(i)}
                      >
                        <span className={styles.num}>{item.n}</span>
                        <span className={styles.itemTitle}>{item.title}</span>
                        <span className={styles.icon} aria-hidden>
                          <img src="/assets/steps/plus.svg" alt="" className={styles.plus} />
                          <img src="/assets/steps/minus.svg" alt="" className={styles.minus} />
                        </span>
                      </button>
                      <div id={`step-${i}`} className={styles.body} data-step-body style={i === 0 ? undefined : { height: 0, opacity: 0 }}>
                        <p>{item.body}</p>
                      </div>
                      <span className={styles.progress} aria-hidden>
                        <span data-step-progress />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className={styles.slider} data-steps-slider>
              <SlideToBook label={steps.slider} />
            </div>
          </div>

          <div className={styles.media} data-steps-media>
            <div className={styles.parallax} data-steps-parallax>
              <div className={styles.photo} data-step-photo>
                <Image
                  src={steps.image}
                  alt="Blue Audi R8 parked above a hillside hedge"
                  fill
                  sizes="(min-width: 900px) 36vw, 100vw"
                  className={styles.img}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
