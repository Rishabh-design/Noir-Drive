'use client';

import { Fragment, useRef } from 'react';
import Image from 'next/image';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { roadIntro } from '@/content/site';
import styles from './RoadIntro.module.css';

// Figma frame "MacBook Pro 16 - 2" is 1728 × 1117; tiles are 135 × 135.
const FRAME_CX = 864;
const FRAME_CY = 558.5;
const TILE = 135;

function SplitLine({ text, index }: { text: string; index: number }) {
  const words = text.split(' ');
  return (
    <span className={styles.line} data-line={index}>
      {words.map((word, w) => (
        <Fragment key={w}>
          <span className={styles.word}>
            {Array.from(word).map((ch, c) => (
              <span key={c} className={styles.char} data-char>
                {ch}
              </span>
            ))}
          </span>
          {w < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </span>
  );
}

/**
 * "The road is ordinary." — pinned interlude. Scrolling fills the headline
 * letter by letter while eight car tiles fly in from depth, then drift apart.
 */
export default function RoadIntro() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const tiles = q('[data-tile]');
      const chars = q('[data-char]');
      const mm = gsap.matchMedia();

      mm.add(
        {
          desktop: '(min-width: 900px)',
          reduce: '(prefers-reduced-motion: reduce)',
        },
        (ctx) => {
          const { desktop, reduce } = ctx.conditions as { desktop: boolean; reduce: boolean };
          if (reduce) return;

          if (desktop) {
            gsap.timeline({
              scrollTrigger: { trigger: root.current, start: 'top top', end: '+=100%', pin: true, anticipatePin: 1 },
            });
          }

          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: root.current,
              start: 'top 70%',
              end: desktop ? '+=170%' : 'bottom 30%',
              scrub: 1,
            },
          });

          tl.fromTo(
            chars,
            { opacity: 0.08, yPercent: 18 },
            { opacity: 1, yPercent: 0, stagger: 0.03, duration: 0.5, ease: 'power1.out' },
            0.1,
          );

          tiles.forEach((tile, i) => {
            const depth = Number(tile.dataset.depth || 1);
            const dx = Number(tile.dataset.dx);
            const dy = Number(tile.dataset.dy);
            const spin = (i % 2 ? 1 : -1) * (8 + depth * 6);
            tl.fromTo(
              tile,
              {
                xPercent: (dx / TILE) * 120 * depth,
                yPercent: (dy / TILE) * 120 * depth + 140,
                scale: 0.25,
                rotate: spin,
                opacity: 0,
              },
              { xPercent: 0, yPercent: 0, scale: 1, rotate: 0, opacity: 1, duration: 0.9, ease: 'power2.out' },
              0.05 + i * 0.07,
            );
            // After landing, everything keeps drifting at its own depth.
            tl.to(
              tile,
              { xPercent: (dx / TILE) * 22 * depth, yPercent: -55 * depth, scale: 1 + depth * 0.12, duration: 1 },
              1.15,
            );
          });

          tl.to(q('[data-title]'), { scale: 0.94, duration: 1 }, 1.15);

          // Pointer depth on the tiles.
          const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
          if (!fine) return;
          const movers = q('[data-tile-mouse]').map((el) => ({
            depth: Number((el.parentElement as HTMLElement).dataset.depth || 1),
            x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3.out' }),
            y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3.out' }),
          }));
          const move = (e: PointerEvent) => {
            const nx = e.clientX / window.innerWidth - 0.5;
            const ny = e.clientY / window.innerHeight - 0.5;
            movers.forEach((m) => {
              m.x(nx * -60 * m.depth);
              m.y(ny * -40 * m.depth);
            });
          };
          root.current!.addEventListener('pointermove', move);
          return () => root.current?.removeEventListener('pointermove', move);
        },
      );

      // Idle float, independent of scroll — paused whenever the section is off-screen.
      if (!prefersReducedMotion()) {
        const floats = q('[data-tile-float]').map((el, i) =>
          gsap.to(el, {
            y: gsap.utils.random(-10, 10),
            rotate: gsap.utils.random(-2.5, 2.5),
            duration: gsap.utils.random(2.8, 4.2),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.2,
            paused: true,
          }),
        );
        ScrollTrigger.create({
          trigger: root.current,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => floats.forEach((t) => (self.isActive ? t.resume() : t.pause())),
        });
      }

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="road" className={styles.road} aria-label="The road is ordinary">
      <div className={styles.stage}>
        <div className={styles.titleWrap}>
          <h2 className={styles.title} data-title aria-label={roadIntro.lines.join(' ')}>
            <span aria-hidden>
              {roadIntro.lines.map((line, i) => (
                <SplitLine key={line} text={line} index={i} />
              ))}
            </span>
          </h2>
        </div>

        {roadIntro.tiles.map((t) => {
          const dx = t.x + TILE / 2 - FRAME_CX;
          const dy = t.y + TILE / 2 - FRAME_CY;
          return (
            <div
              key={t.src}
              className={styles.tile}
              style={{ '--dx': dx, '--dy': dy } as React.CSSProperties}
              data-tile
              data-dx={dx}
              data-dy={dy}
              data-depth={t.depth}
            >
              <div className={styles.tileMouse} data-tile-mouse>
                <div className={styles.tileFloat} data-tile-float>
                  <div className={styles.tileImg}>
                    <Image src={t.src} alt={t.alt} fill sizes="(min-width: 900px) 10vw, 16vw" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
