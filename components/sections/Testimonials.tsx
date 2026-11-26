'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { testimonials } from '@/content/site';
import { revealChars, revealEyebrow } from '@/components/motion/reveal';
import { type Blur, focusPull, setBlur } from '@/components/motion/focusPull';
import Eyebrow from '@/components/ui/Eyebrow';
import clsx from '@/lib/clsx';
import { remUnit } from '@/lib/units';
import styles from './Testimonials.module.css';

/*
 * Fan of cards measured from Figma "Frame 43" (184:132, 1545 × 955).
 * x: card centre from the frame centre; y: card centre from the frame top;
 * s: size relative to the front card (449.19 × 576.26); blur in rendered px.
 */
const CARD_W = 449.187;
const CARD_H = 576.26;
const SLOTS: Record<number, { x: number; y: number; s: number; r: number; blur: number; o: number; z: number }> = {
  [-3]: { x: -840, y: 505, s: 0.3, r: 10, blur: 10, o: 0, z: 0 },
  [-2]: { x: -667, y: 515.4, s: 0.404, r: 7.71, blur: 7.5, o: 0.7, z: 2 },
  [-1]: { x: -400.3, y: 525, s: 0.739, r: 3.45, blur: 3.85, o: 0.87, z: 5 },
  0: { x: -0.13, y: 544.1, s: 1, r: -8.08, blur: 0, o: 1, z: 10 },
  1: { x: 400.9, y: 525, s: 0.739, r: 2.61, blur: 3.85, o: 0.87, z: 5 },
  2: { x: 667.6, y: 515.3, s: 0.404, r: -7.39, blur: 7.95, o: 0.7, z: 2 },
  3: { x: 840, y: 505, s: 0.3, r: -10, blur: 10, o: 0, z: 0 },
};

// Three stories, dealt twice so all five visible slots stay filled as the deck turns.
const DECK = [...testimonials.items, ...testimonials.items];
const N = DECK.length;
const UNIQUE = testimonials.items.length;
const START = 1; // Isabella Rodriguez in front, as designed
const AUTOPLAY = 5;
const rel = (i: number, active: number) => ((i - active + N + 3) % N) - 3;

/** Shell moves + blurs at on-screen radius; the inner pose scales and tilts (see Fleet). */
function slotVars(slot: number) {
  const s = SLOTS[slot];
  const unit = remUnit();
  return {
    pos: { xPercent: (s.x / CARD_W) * 100, yPercent: (s.y / CARD_H) * 100, opacity: s.o },
    pose: { scale: s.s, rotate: s.r },
    blur: s.blur * unit,
  };
}

const poseOf = (card: HTMLElement) => card.firstElementChild as HTMLElement;

export default function Testimonials() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLElement[]>([]);
  const [active, setActive] = useState(START);
  const activeRef = useRef(START);
  const busy = useRef(false);
  const dealt = useRef(false);
  const auto = useRef<gsap.core.Tween | null>(null);
  const paused = useRef(false);
  const blurs = useRef<Blur[]>([]);
  const blurOf = (i: number) => (blurs.current[i] ??= { v: 0 });

  // Settle every card into its slot (resize) — cancels any turn in progress.
  const place = useCallback(() => {
    if (!dealt.current) return;
    busy.current = false;
    cards.current.forEach((card, i) => {
      const slot = rel(i, activeRef.current);
      const { pos, pose, blur } = slotVars(slot);
      gsap.killTweensOf([card, poseOf(card)]);
      gsap.set(card, { ...pos, zIndex: SLOTS[slot].z });
      gsap.set(poseOf(card), pose);
      setBlur(card, blurOf(i), blur);
    });
  }, []);

  const go = useCallback((dir: number) => {
    if (busy.current || !dealt.current || dir === 0) return;
    busy.current = true;
    const prev = activeRef.current;
    const next = (prev + dir + N) % N;
    activeRef.current = next;
    setActive(next);
    const reduce = prefersReducedMotion();
    const tl = gsap.timeline({
      // overwrite:auto lets a quick next click take over a focus pull still in progress.
      defaults: { duration: reduce ? 0.01 : 1.25, ease: 'power3.inOut', overwrite: 'auto' },
    });
    // Unlock as soon as the cards have landed; the blur may still be settling.
    tl.call(() => {
      busy.current = false;
    }, [], reduce ? 0.01 : 1.2);
    cards.current.forEach((card, i) => {
      const from = rel(i, prev);
      const to = rel(i, next);
      if (Math.abs(to - from) > 1) {
        const park = slotVars(to > 0 ? 3 : -3);
        gsap.set(card, { ...park.pos, zIndex: 0 });
        gsap.set(poseOf(card), park.pose);
        setBlur(card, blurOf(i), park.blur);
      }
      const { pos, pose, blur } = slotVars(to);
      tl.to(card, pos, 0);
      tl.to(poseOf(card), pose, 0);
      focusPull(tl, card, blurOf(i), blur, 0, reduce);
      tl.set(card, { zIndex: SLOTS[to].z }, reduce ? 0 : 0.5);
    });
  }, []);

  // Autoplay: a delayed call that re-arms after every move.
  const arm = useCallback(() => {
    auto.current?.kill();
    if (prefersReducedMotion()) return;
    auto.current = gsap.delayedCall(AUTOPLAY, () => {
      go(1);
      arm();
    });
    if (paused.current) auto.current.pause();
  }, [go]);

  const step = useCallback(
    (dir: number) => {
      go(dir);
      arm();
    },
    [go, arm],
  );

  useEffect(() => {
    const onResize = () => place();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      auto.current?.kill();
    };
  }, [place]);

  // Drag / swipe.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let down = false;
    const onDown = (e: PointerEvent) => {
      down = true;
      sx = e.clientX;
      sy = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      if (!down) return;
      down = false;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [step]);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      revealEyebrow(q('[data-eyebrow]')[0]);
      revealChars(q('[data-tm-title]')[0], q('[data-tm-head]')[0], { delay: 0.1 });

      // Before the deal: the whole deck waits face-down in the centre slot.
      cards.current.forEach((card, i) => {
        const slot = rel(i, START);
        const front = slotVars(0);
        gsap.set(card, { ...front.pos, yPercent: front.pos.yPercent + 30, opacity: 0, zIndex: SLOTS[slot].z });
        gsap.set(poseOf(card), front.pose);
        setBlur(card, blurOf(i), front.blur);
      });

      const deal = () => {
        const tl = gsap.timeline({
          onComplete: () => {
            dealt.current = true;
            arm();
          },
        });
        cards.current.forEach((card, i) => {
          const slot = rel(i, START);
          const { pos, pose, blur } = slotVars(slot);
          const reduce = prefersReducedMotion();
          const d = reduce ? 0.01 : 1.6;
          tl.to(card, { ...pos, duration: d, ease: 'power3.out' }, Math.abs(slot) * 0.12);
          tl.to(poseOf(card), { ...pose, duration: d, ease: 'power3.out' }, Math.abs(slot) * 0.12);
          focusPull(tl, card, blurOf(i), blur, Math.abs(slot) * 0.12, reduce);
        });
        gsap.from(q('[data-tm-progress]'), { scaleX: 0, opacity: 0, duration: 1.4, ease: 'noir', delay: 0.5 });
      };

      ScrollTrigger.create({ trigger: stage.current, start: 'top 75%', once: true, onEnter: deal });

      // Pause autoplay while off-screen.
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => {
          if (!dealt.current) return;
          if (self.isActive && !paused.current) auto.current?.resume();
          else auto.current?.pause();
        },
      });
    },
    { scope: root },
  );

  const thumb = active % UNIQUE;

  return (
    <section ref={root} id="testimonials" className={styles.testimonials} aria-label="Client stories">
      <div className={styles.frame}>
        <header className={styles.head} data-tm-head>
          <Eyebrow
            text={testimonials.eyebrow}
            tone="dark"
            gap={23.641}
            left={{ src: '/assets/testimonials/eyebrow-line-left.svg' }}
            right={{ src: '/assets/testimonials/eyebrow-line-right.svg', flip: true }}
          />
          <h2 className={styles.title} data-tm-title>
            {testimonials.title}
          </h2>
        </header>

        <div
          ref={stage}
          className={styles.stage}
          data-cursor="drag"
          data-cursor-label="Drag"
          onPointerEnter={() => {
            paused.current = true;
            auto.current?.pause();
          }}
          onPointerLeave={() => {
            paused.current = false;
            auto.current?.resume();
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') step(1);
            if (e.key === 'ArrowLeft') step(-1);
          }}
        >
          {DECK.map((t, i) => {
            const slot = rel(i, active);
            return (
              <div
                key={i}
                ref={(el) => {
                  if (el) cards.current[i] = el;
                }}
                className={clsx(styles.card, slot === 0 && styles.isActive)}
                aria-hidden={slot !== 0}
                onClick={() => slot !== 0 && Math.abs(slot) <= 2 && step(Math.sign(slot))}
              >
                <figure className={styles.pose}>
                <img width={71} height={71} src="/assets/testimonials/quote.svg" alt="" className={styles.quote} />
                <div className={styles.stars} role="img" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <img width={30} height={30} key={s} src="/assets/testimonials/star.svg" alt="" />
                  ))}
                </div>
                <blockquote className={styles.text}>{t.quote}</blockquote>
                <figcaption className={styles.author}>
                  <span className={styles.avatar}>
                    <Image src={t.avatar} alt="" fill sizes="80px" />
                  </span>
                  <span>
                    <span className={styles.name}>{t.name}</span>
                    <span className={styles.role}>{t.role}</span>
                  </span>
                </figcaption>
                <span className={styles.edge} aria-hidden />
                </figure>
              </div>
            );
          })}
        </div>

        <div className={styles.progress} data-tm-progress>
          <span className={styles.track} />
          {testimonials.items.map((t, i) => (
            <button
              key={t.name}
              type="button"
              className={styles.dot}
              style={{ left: `${(i / (UNIQUE - 1)) * 100}%` }}
              onClick={() => {
                const diff = ((i - thumb + UNIQUE + 1) % UNIQUE) - 1;
                if (diff !== 0) step(diff);
              }}
              aria-label={`Show review from ${t.name}`}
            />
          ))}
          <span className={styles.thumb} style={{ '--i': thumb, '--n': UNIQUE - 1 } as React.CSSProperties} />
        </div>
      </div>
    </section>
  );
}
