'use client';

import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { experience } from '@/content/site';
import { revealChars, revealEyebrow, revealLines } from '@/components/motion/reveal';
import Eyebrow from '@/components/ui/Eyebrow';
import styles from './Experience.module.css';

/** "Unparalleled Experience" — four promises and the numbers behind them. */
export default function Experience() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      revealEyebrow(q('[data-eyebrow]')[0]);
      revealChars(q('[data-exp-title]')[0], q('[data-exp-head]')[0], { delay: 0.1 });
      revealLines(q('[data-exp-body]')[0], q('[data-exp-head]')[0], { delay: 0.3 });

      const reduce = prefersReducedMotion();

      // Features: the disc spins up, the icon pops, copy follows.
      q('[data-feature]').forEach((f, i) => {
        const tl = gsap.timeline({
          delay: i * 0.12,
          scrollTrigger: { trigger: q('[data-features]')[0], start: 'top 82%', once: true },
        });
        // fromTo + clearProps: these elements own CSS hover transforms, so GSAP must
        // not read their (possibly mid-transition) computed values or leave inline transforms.
        tl.fromTo(
          f.querySelector('[data-disc]'),
          { scale: 0, rotate: -120 },
          { scale: 1, rotate: 0, duration: 1.3, ease: 'back.out(1.6)', clearProps: 'transform' },
        )
          .fromTo(
            f.querySelector('[data-icon]'),
            { scale: 0.2, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(2.2)', clearProps: 'transform,opacity' },
            0.35,
          )
          .from(f.querySelectorAll('[data-copy]'), { yPercent: 60, opacity: 0, duration: 1.1, stagger: 0.1 }, 0.25);
        if (reduce) tl.progress(1);
      });

      // Stats: rules draw from the centre, numbers count up.
      const stats = q('[data-stats]')[0];
      gsap.from(q('[data-rule]'), {
        scaleX: 0,
        duration: 1.8,
        ease: 'noir',
        scrollTrigger: { trigger: stats, start: 'top 88%', once: true },
      });
      q('[data-stat]').forEach((s, i) => {
        const numEl = s.querySelector<HTMLElement>('[data-num]')!;
        const target = Number(numEl.dataset.value);
        const decimals = Number(numEl.dataset.decimals);
        const counter = { v: 0 };
        gsap.from(s, {
          y: 40,
          opacity: 0,
          duration: 1.2,
          delay: i * 0.1,
          scrollTrigger: { trigger: stats, start: 'top 85%', once: true },
        });
        gsap.to(counter, {
          v: target,
          duration: reduce ? 0.01 : 2.4,
          delay: 0.15 + i * 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: stats, start: 'top 85%', once: true },
          onUpdate: () => {
            numEl.textContent = counter.v.toFixed(decimals);
          },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="experience" className={styles.experience}>
      <div className={styles.container}>
        <header className={styles.head} data-exp-head>
          <Eyebrow
            text={experience.eyebrow}
            tone="muted"
            gap={23.562}
            left={{ src: '/assets/experience/eyebrow-line-left.svg', flip: true }}
            right={{ src: '/assets/experience/eyebrow-line-right.svg' }}
          />
          <h2 className={styles.title} data-exp-title>
            {experience.title}
          </h2>
          <p className={styles.body} data-exp-body>
            {experience.body}
          </p>
        </header>

        <ul className={styles.features} data-features>
          {experience.features.map((f) => (
            <li key={f.title} className={styles.feature} data-feature>
              <span className={styles.discWrap}>
                <span className={styles.ring} data-ring aria-hidden />
                <span className={styles.disc} data-disc>
                  <img width={47} height={47} src={f.icon} alt="" className={styles.icon} data-icon />
                </span>
              </span>
              <h3 className={styles.featureTitle} data-copy>
                {f.title}
              </h3>
              <p className={styles.featureBody} data-copy>
                {f.body}
              </p>
            </li>
          ))}
        </ul>

        <div className={styles.stats} data-stats>
          <span className={styles.ruleTop} data-rule aria-hidden />
          <span className={styles.ruleBottom} data-rule aria-hidden />
          {experience.stats.map((s) => (
            <div key={s.label} className={styles.stat} data-stat>
              <p className={styles.statValue}>
                <span data-num data-value={s.value} data-decimals={s.decimals}>
                  {s.value.toFixed(s.decimals)}
                </span>
                {s.suffix}
              </p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
