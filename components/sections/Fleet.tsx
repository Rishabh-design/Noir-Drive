'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { whenIdle } from '@/lib/idle';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { fleet, fleetIntro } from '@/content/site';
import { revealChars, revealEyebrow, revealLines } from '@/components/motion/reveal';
import { type Blur, focusPull, setBlur } from '@/components/motion/focusPull';
import { bloomCentre, bloomHandlers, bloomOut } from '@/components/motion/colourBloom';
import bloom from '@/components/motion/Bloom.module.css';
import Eyebrow from '@/components/ui/Eyebrow';
import Magnetic from '@/components/ui/Magnetic';
import clsx from '@/lib/clsx';
import { remUnit } from '@/lib/units';
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

/**
 * A slot splits across two layers: the card shell moves and carries the blur, the
 * inner `pose` layer scales and tilts. Because the shell itself is never scaled,
 * its blur runs at the real on-screen radius (up to 5× cheaper than blurring a
 * full-size card and shrinking it) while looking exactly the same.
 */
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

// Image `sizes` per slot distance: centre, neighbours, far. When a card slides to the
// centre the browser fetches the sharper file while the focus pull is still running.
const SLOT_SIZES = [
  '(min-width: 900px) 43vw, 77vw',
  '(min-width: 900px) 23vw, 41vw',
  '(min-width: 900px) 15vw, 26vw',
];

export default function Fleet() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<HTMLElement[]>([]);
  const [active, setActive] = useState(START);
  const activeRef = useRef(START);
  const busy = useRef(false);
  const dragged = useRef(false);
  const blurs = useRef<Blur[]>([]);
  const faces = useRef<HTMLElement[]>([]);
  // Mouse/trackpad screens bloom on hover; touch screens bloom the centre card.
  const touch = useRef(false);
  useEffect(() => {
    touch.current = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }, []);

  const bloomActive = useCallback((i: number) => {
    const face = faces.current[i];
    if (face) bloomCentre(face);
  }, []);
  const drain = useCallback((i: number) => {
    const face = faces.current[i];
    if (face) bloomOut(face);
  }, []);

  // Place every card in its slot (no animation) — on mount and on resize.
  // Any slide in progress is settled first so the two never fight.
  const place = useCallback(() => {
    busy.current = false;
    cards.current.forEach((card, i) => {
      const slot = rel(i, activeRef.current);
      const { pos, pose, blur } = slotVars(slot);
      gsap.killTweensOf([card, poseOf(card)]);
      gsap.set(card, { ...pos, zIndex: SLOTS[slot].z });
      gsap.set(poseOf(card), pose);
      setBlur(card, (blurs.current[i] ??= { v: 0 }), blur);
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
      // overwrite:auto lets a quick next click take over a focus pull still in progress.
      defaults: { duration: reduce ? 0.01 : 1.25, ease: 'power3.inOut', overwrite: 'auto' },
    });
    // Unlock as soon as the cards have landed; the blur may still be settling.
    tl.call(() => {
      busy.current = false;
      if (touch.current) bloomActive(next);
    }, [], reduce ? 0.01 : 1.2);
    if (touch.current) drain(prev);

    cards.current.forEach((card, i) => {
      const from = rel(i, prev);
      const to = rel(i, next);
      const b = (blurs.current[i] ??= { v: 0 });
      // A card wrapping around the back jumps between the hidden parking slots first.
      if (Math.abs(to - from) > 1) {
        const park = slotVars(to > 0 ? 3 : -3);
        gsap.set(card, { ...park.pos, zIndex: 0 });
        gsap.set(poseOf(card), park.pose);
        setBlur(card, b, park.blur);
      }
      const { pos, pose, blur } = slotVars(to);
      tl.to(card, pos, 0);
      tl.to(poseOf(card), pose, 0);
      focusPull(tl, card, b, blur, 0, reduce);
      tl.set(card, { zIndex: SLOTS[to].z }, reduce ? 0 : 0.5);
    });
  }, [bloomActive, drain]);

  // Step toward card i one slot at a time (each step is the normal slide).
  const goTo = useCallback(
    (i: number) => {
      const offset = rel(i, activeRef.current);
      if (offset === 0) return;
      go(Math.sign(offset));
      if (Math.abs(offset) > 1) gsap.delayedCall(prefersReducedMotion() ? 0.05 : 1.22, () => goTo(i));
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
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [go]);

  // Scroll choreography.
  // Below the fold: set up in an idle slice after hydration (see lib/idle.ts).
  useGSAP(
    (_ctx, contextSafe) =>
      whenIdle(
        contextSafe!(() => {
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

          // The glow eases in once and then simply stays.
          gsap.from(q('[data-fleet-glow]'), {
            opacity: 0,
            duration: 2.4,
            ease: 'sine.inOut',
            scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
          });

          gsap.from(q('[data-card-wrap]'), {
            yPercent: 35,
            opacity: 0,
            duration: 1.6,
            ease: 'noirOut',
            stagger: { each: 0.08, from: 'center' },
            scrollTrigger: { trigger: root.current, start: 'top 45%', once: true },
          });

          if (touch.current) {
            ScrollTrigger.create({
              trigger: root.current,
              start: 'top 40%',
              once: true,
              onEnter: () => gsap.delayedCall(1.5, () => bloomActive(activeRef.current)),
            });
          }

          gsap.from(q('[data-fleet-ui]'), {
            y: 30,
            opacity: 0,
            duration: 1.2,
            stagger: 0.1,
            scrollTrigger: { trigger: root.current, start: 'top 35%', once: true },
          });
        }),
      ),
    { scope: root },
  );

  return (
    <section ref={root} id="fleet" className={styles.fleet} aria-label="Our collection">
      <div className={styles.frame} data-fleet-frame>
        {/* Figma Group 7 (three blurred ellipses), pre-rendered: static, no per-frame blur cost. */}
        <img width={856} height={539} src="/assets/fleet/glow.webp" alt="" className={styles.glow} loading="lazy" decoding="async" data-fleet-glow />

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
                <div className={styles.pose}>
                <div className={styles.cardWrap} data-card-wrap>
                  <div
                    ref={(el) => {
                      if (el) faces.current[i] = el;
                    }}
                    className={clsx(styles.cardFace, bloom.face)}
                    {...bloomHandlers({ pose: () => poseOf(cards.current[i]) })}
                  >
                    {/* Default: the photo in the site's muted grade. */}
                    <Image
                      src={car.tone}
                      alt={car.name}
                      fill
                      sizes={SLOT_SIZES[Math.min(Math.abs(slot), 2)]}
                      className={styles.cardImg}
                      style={{ objectPosition: car.focus }}
                      draggable={false}
                    />
                    {/* The original colours, revealed by the bloom (see colourBloom.ts). */}
                    <span className={bloom.colour} aria-hidden>
                      <Image
                        src={car.image}
                        alt=""
                        fill
                        sizes={SLOT_SIZES[Math.min(Math.abs(slot), 2)]}
                        className={styles.cardImg}
                        style={{ objectPosition: car.focus }}
                        draggable={false}
                      />
                    </span>
                    <span className={bloom.light} aria-hidden />
                    <span className={styles.cardShade} />
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
                          <img width={12} height={12} src="/assets/fleet/view-arrow-lg.svg" alt="" />
                        </a>
                      </div>
                    </div>
                    <span className={styles.cardGlow} />
                  </div>
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
            className={styles.eyebrow}
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
          <img width={70} height={70} src="/assets/fleet/nav-prev.svg" alt="" />
        </button>
        <button type="button" className={clsx(styles.nav, styles.next)} onClick={() => go(1)} aria-label="Next car" data-fleet-ui>
          <img width={70} height={70} src="/assets/fleet/nav-next.svg" alt="" />
        </button>

        {/* Phones: swipe the cards; the dots show where you are. */}
        <div className={styles.dots} data-fleet-ui>
          {fleet.map((car, i) => (
            <button
              key={car.name}
              type="button"
              className={clsx(styles.dot, i === active && styles.dotActive)}
              onClick={() => goTo(i)}
              aria-label={`Show ${car.name}`}
            />
          ))}
        </div>

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
