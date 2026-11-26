'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { fleet, fleetIntro } from '@/content/site';
import { revealChars, revealEyebrow, revealLines } from '@/components/motion/reveal';
import Eyebrow from '@/components/ui/Eyebrow';
import Magnetic from '@/components/ui/Magnetic';
import clsx from '@/lib/clsx';
import styles from './Fleet.module.css';

/*
 * Card slots, measured from the Figma "Container" frame (184:440, 1711 × 1078).
 * x is the card centre relative to the frame centre, y the card centre from the
 * frame top, s the size relative to the hero card (739.59 × 412), blur the
 * rendered blur in design px. Slots ±3 are off-stage parking spots.
 */
const CARD_W = 739.587;
const CARD_H = 412;
const SLOTS: Record<number, { x: number; y: number; s: number; blur: number; o: number; r: number; z: number }> = {
  [-3]: { x: -780, y: 330, s: 0.2, blur: 30, o: 0, r: 0, z: 0 },
  [-2]: { x: -570.12, y: 390.18, s: 0.331, blur: 26.9, o: 1, r: 0, z: 1 },
  [-1]: { x: -375.62, y: 497.56, s: 0.527, blur: 8.35, o: 1, r: 0, z: 3 },
  0: { x: -16.07, y: 546.72, s: 1, blur: 0, o: 1, r: -5.7, z: 10 },
  1: { x: 385.38, y: 497.56, s: 0.527, blur: 8.35, o: 1, r: 0, z: 3 },
  2: { x: 580.88, y: 390.18, s: 0.331, blur: 26.9, o: 1, r: 0, z: 1 },
  3: { x: 780, y: 330, s: 0.2, blur: 30, o: 0, r: 0, z: 0 },
};

const N = fleet.length;
const START = fleet.findIndex((c) => c.tag === 'Luxury');
const rel = (i: number, active: number) => ((i - active + N + 3) % N) - 3;

function slotVars(slot: number) {
  const s = SLOTS[slot];
  const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) / 10;
  return {
    xPercent: (s.x / CARD_W) * 100,
    yPercent: (s.y / CARD_H) * 100,
    scale: s.s,
    rotate: s.r,
    opacity: s.o,
    filter: `blur(${((s.blur * unit) / s.s).toFixed(2)}px)`,
  };
}

export default function Fleet() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLElement[]>([]);
  const [active, setActive] = useState(START);
  const activeRef = useRef(START);
  const busy = useRef(false);
  const dragged = useRef(false);

  // Place every card in its slot (no animation) — on mount and on resize.
  const place = useCallback(() => {
    cards.current.forEach((card, i) => {
      const slot = rel(i, activeRef.current);
      gsap.set(card, { ...slotVars(slot), zIndex: SLOTS[slot].z });
    });
  }, []);

  useEffect(() => {
    place();
    const onResize = () => place();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [place]);

  const go = useCallback((dir: number) => {
    if (busy.current || dir === 0) return;
    busy.current = true;
    const prev = activeRef.current;
    const next = (prev + dir + N) % N;
    activeRef.current = next;
    setActive(next);

    const reduce = prefersReducedMotion();
    const tl = gsap.timeline({
      defaults: { duration: reduce ? 0.01 : 1.15, ease: 'noir' },
      onComplete: () => {
        busy.current = false;
      },
    });

    cards.current.forEach((card, i) => {
      const from = rel(i, prev);
      const to = rel(i, next);
      // A card wrapping around the back jumps between the hidden parking slots first.
      if (Math.abs(to - from) > 1) {
        gsap.set(card, { ...slotVars(to > 0 ? 3 : -3), zIndex: 0 });
      }
      tl.to(card, { ...slotVars(to) }, 0);
      tl.set(card, { zIndex: SLOTS[to].z }, reduce ? 0 : 0.42);
    });
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const offset = rel(i, activeRef.current);
      if (offset !== 0) go(Math.sign(offset));
    },
    [go],
  );

  // Drag / swipe anywhere on the stage.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    const down = (e: PointerEvent) => {
      dragging = true;
      dragged.current = false;
      startX = e.clientX;
      startY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 8) dragged.current = true;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [go]);

  // 3D tilt + light sheen on whichever card is in front.
  useEffect(() => {
    const el = stage.current;
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const move = (e: PointerEvent) => {
      const card = cards.current[activeRef.current];
      const tilt = card?.querySelector<HTMLElement>('[data-tilt]');
      if (!card || !tilt) return;
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
      const inside = Math.abs(nx) < 0.75 && Math.abs(ny) < 0.85;
      gsap.to(tilt, {
        rotateY: inside ? nx * 10 : 0,
        rotateX: inside ? ny * -8 : 0,
        duration: 0.9,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      tilt.style.setProperty('--sx', `${(nx + 0.5) * 100}%`);
      tilt.style.setProperty('--sy', `${(ny + 0.5) * 100}%`);
    };
    const leave = () => {
      cards.current.forEach((c) => {
        const t = c.querySelector('[data-tilt]');
        if (t) gsap.to(t, { rotateX: 0, rotateY: 0, duration: 1.2, ease: 'power3.out' });
      });
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);

  // Scroll choreography.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      revealEyebrow(q('[data-eyebrow]')[0], { start: 'top 75%' });
      revealChars(q('[data-fleet-title]')[0], root.current!, { start: 'top 70%', delay: 0.1 });
      revealLines(q('[data-fleet-body]')[0], root.current!, { start: 'top 70%', delay: 0.35 });

      if (prefersReducedMotion()) return;

      gsap.fromTo(
        q('[data-fleet-frame]'),
        { scale: 0.9, borderRadius: '6rem' },
        {
          scale: 1,
          borderRadius: '2.4rem',
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top 15%', scrub: true },
        },
      );

      gsap.fromTo(
        q('[data-fleet-land]'),
        { yPercent: 14 },
        {
          yPercent: -4,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: true },
        },
      );

      gsap.to(q('[data-fleet-glow]'), {
        scale: 1.08,
        opacity: 0.8,
        duration: 5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      gsap.from(q('[data-card-wrap]'), {
        yPercent: 35,
        opacity: 0,
        duration: 1.6,
        ease: 'noirOut',
        stagger: { each: 0.08, from: 'center' },
        scrollTrigger: { trigger: root.current, start: 'top 45%', once: true },
      });

      gsap.from(q('[data-fleet-ui]'), {
        y: 30,
        opacity: 0,
        duration: 1.2,
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 35%', once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="fleet" className={styles.fleet} aria-label="Our collection">
      <div className={styles.frame} data-fleet-frame>
        <img src="/assets/fleet/glow.svg" alt="" className={styles.glow} data-fleet-glow />

        <div
          ref={stage}
          className={styles.stage}
          data-cursor="drag"
          data-cursor-label="Drag"
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
          }}
        >
          {fleet.map((car, i) => {
            const slot = rel(i, active);
            const isActive = slot === 0;
            return (
              <article
                key={car.name}
                ref={(el) => {
                  if (el) cards.current[i] = el;
                }}
                className={clsx(styles.card, isActive && styles.isActive)}
                aria-hidden={Math.abs(slot) > 2}
                aria-label={`${car.name}, ${car.price} per day`}
                onClick={() => {
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  if (!isActive) goTo(i);
                }}
              >
                <div className={styles.cardWrap} data-card-wrap>
                  <div className={styles.cardTilt} data-tilt>
                    <Image
                      src={car.image}
                      alt={car.name}
                      fill
                      sizes="(min-width: 900px) 45vw, 80vw"
                      className={styles.cardImg}
                      style={{ objectPosition: car.focus }}
                      draggable={false}
                    />
                    <span className={styles.cardShade} />
                    <span className={styles.cardSheen} />
                    <div className={styles.cardInfo}>
                      <div className={styles.cardLeft}>
                        <span className={styles.chip}>{car.tag}</span>
                        <h3 className={styles.cardName}>{car.name}</h3>
                        <p className={styles.cardSub}>{car.subtitle}</p>
                      </div>
                      <div className={styles.cardRight}>
                        <p className={styles.price}>{car.price} / day</p>
                        <p className={styles.insured}>Insurance Included</p>
                        <a href="#contact" className={styles.details} tabIndex={isActive ? 0 : -1} data-cursor="hover">
                          View Details
                          <img src="/assets/fleet/view-arrow-lg.svg" alt="" />
                        </a>
                      </div>
                    </div>
                    <span className={styles.cardGlow} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.landscape} data-fleet-land aria-hidden>
          <Image src="/assets/fleet/landscape.webp" alt="" fill sizes="100vw" className={styles.landscapeImg} />
        </div>

        <header className={styles.intro}>
          <Eyebrow
            text={fleetIntro.eyebrow}
            tone="light"
            left={{ src: '/assets/fleet/eyebrow-line-left.svg' }}
            right={{ src: '/assets/fleet/eyebrow-line-right.svg', flip: true }}
          />
          <h2 className={styles.title} data-fleet-title>
            {fleetIntro.title}
          </h2>
          <p className={styles.body} data-fleet-body>
            {fleetIntro.body}
          </p>
        </header>

        <button type="button" className={clsx(styles.nav, styles.prev)} onClick={() => go(-1)} aria-label="Previous car" data-fleet-ui>
          <img src="/assets/fleet/nav-prev.svg" alt="" />
        </button>
        <button type="button" className={clsx(styles.nav, styles.next)} onClick={() => go(1)} aria-label="Next car" data-fleet-ui>
          <img src="/assets/fleet/nav-next.svg" alt="" />
        </button>

        <div className={styles.ctaWrap} data-fleet-ui>
          <Magnetic strength={0.3}>
            <a href="#contact" className={styles.cta}>
              <span>{fleetIntro.cta}</span>
            </a>
          </Magnetic>
        </div>

        <p className="sr-only" aria-live="polite">
          {fleet[active].name}, {active + 1} of {N}
        </p>
      </div>
    </section>
  );
}
