'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap, SplitText, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { markHeroCta, onIntroDone } from '@/lib/intro';
import { hero } from '@/content/site';
import styles from './Hero.module.css';

type Notch = { grow: number; strip: number };

/**
 * The hero's silhouette (Figma "Subtract"): a rounded frame with a hole around
 * the CTA circle that runs down into the bottom edge. Measured: ring gap 5.5,
 * strip half-width 110/158 r, fillets 9, corners 24 (design px).
 *
 * `grow` (0→1) opens the hole from nothing; `strip` (0→1) then widens its
 * bottom into the filleted strip. grow = 0 is a plain rounded rectangle.
 */
function heroPath(w: number, h: number, cx: number, cy: number, r: number, unit: number, n: Notch) {
  const p = (v: number) => Math.round(v * 100) / 100;
  const rc = 24 * unit;
  const rect = [
    `M0,${p(rc)}`,
    `A${p(rc)},${p(rc)} 0 0 1 ${p(rc)},0`,
    `L${p(w - rc)},0`,
    `A${p(rc)},${p(rc)} 0 0 1 ${p(w)},${p(rc)}`,
    `L${p(w)},${p(h - rc)}`,
    `A${p(rc)},${p(rc)} 0 0 1 ${p(w - rc)},${p(h)}`,
  ];
  const close = [`L${p(rc)},${p(h)}`, `A${p(rc)},${p(rc)} 0 0 1 0,${p(h - rc)}`, 'Z'];
  const Rf = r + 5.5 * unit;
  const R = Rf * Math.max(n.grow, 0);

  if (R < 0.5) return `path('${[...rect, ...close].join(' ')}')`;

  if (n.strip <= 0) {
    // Plain circular hole (even-odd); anything outside the frame is clipped by overflow anyway.
    const circle = `M${p(cx - R)},${p(cy)} A${p(R)},${p(R)} 0 1 0 ${p(cx + R)},${p(cy)} A${p(R)},${p(R)} 0 1 0 ${p(cx - R)},${p(cy)} Z`;
    return `path(evenodd, '${[...rect, ...close].join(' ')} ${circle}')`;
  }

  // Strip phase: start from the circle's own chord at the bottom edge (zero-length strip)
  // and widen to the designed half-width, growing the fillets in with it.
  const chord = Math.sqrt(Math.max(R * R - (h - cy) * (h - cy), 0));
  const hw = chord + (r * (110 / 158) - chord) * n.strip;
  const f = 9 * unit * n.strip;
  const yj = cy + Math.sqrt(Math.max(R * R - hw * hw, 0));
  return `path('${[
    ...rect,
    `L${p(cx + hw + f)},${p(h)}`,
    `A${p(f)},${p(f)} 0 0 1 ${p(cx + hw)},${p(h - f)}`,
    `L${p(cx + hw)},${p(yj)}`,
    `A${p(R)},${p(R)} 0 1 0 ${p(cx - hw)},${p(yj)}`,
    `L${p(cx - hw)},${p(h - f)}`,
    `A${p(f)},${p(f)} 0 0 1 ${p(cx - hw - f)},${p(h)}`,
    ...close,
  ].join(' ')}')`;
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const circle = useRef<HTMLAnchorElement>(null);
  const clip = useRef<HTMLDivElement>(null);
  const notch = useRef<Notch>({ grow: 0, strip: 0 });
  const applyNotch = useRef<() => void>(() => {});

  // Keep the silhouette glued to the CTA circle at every viewport size.
  useEffect(() => {
    const f = frame.current;
    const c = circle.current;
    const cl = clip.current;
    if (!f || !c || !cl) return;
    applyNotch.current = () => {
      const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) / 10;
      const r = c.offsetWidth / 2;
      cl.style.clipPath = heroPath(f.offsetWidth, f.offsetHeight, c.offsetLeft + r, c.offsetTop + r, r, unit, notch.current);
    };
    applyNotch.current();
    const ro = new ResizeObserver(() => applyNotch.current());
    ro.observe(f);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const lines = q('[data-hero-line]');
      const body = q('[data-hero-body]')[0];
      const reduce = prefersReducedMotion();

      // Resting state: a clean, uninterrupted frame; the CTA is not there yet.
      // The photo itself is painted immediately (good LCP); a dark cover dissolves off it.
      gsap.set(q('[data-hero-cover]'), { opacity: 1 });
      gsap.set(q('[data-hero-zoom]'), { scale: 1.12 });
      gsap.set(lines, { yPercent: 110 });
      gsap.set(q('[data-hero-circle]'), { scale: 0, rotate: -60 });
      gsap.set(q('[data-hero-arrow]'), { xPercent: -35, yPercent: 35, opacity: 0 });
      gsap.set(q('[data-hero-pill]'), { scale: 0.6, opacity: 0, transformOrigin: '100% 100%' });
      gsap.set(q('[data-hero-scroll]'), { opacity: 0 });

      let split: SplitText | null = null;
      const off = onIntroDone(() => {
        split = SplitText.create(body, { type: 'lines', mask: 'lines', linesClass: 'split-line', aria: 'none' });
        const pop = { v: 0 };
        const tl = gsap.timeline();
        tl
          // 1 · the car surfaces inside the full frame — a slow dissolve and settle, no wipes.
          .to(q('[data-hero-cover]'), { opacity: 0, duration: 1.6, ease: 'sine.inOut' }, 0)
          .to(q('[data-hero-zoom]'), { scale: 1, duration: 3, ease: 'power3.out' }, 0)
          // 2 · the copy
          .to(lines, { yPercent: 0, duration: 1.5, stagger: 0.1, ease: 'power4.out' }, 0.55)
          .from(split.lines, { yPercent: 100, opacity: 0, duration: 1.3, stagger: 0.08, ease: 'power3.out' }, 0.95)
          // 3 · only now the cut-out opens and the disc pops through it
          .add(() => markHeroCta(), 1.85)
          .to(
            pop,
            {
              v: 1,
              duration: 1.1,
              ease: 'back.out(1.5)',
              onUpdate: () => {
                notch.current.grow = pop.v;
                gsap.set(q('[data-hero-circle]'), { scale: pop.v, rotate: -60 * (1 - pop.v) });
                applyNotch.current();
              },
            },
            1.85,
          )
          .to(
            notch.current,
            { strip: 1, duration: 0.55, ease: 'power2.inOut', onUpdate: () => applyNotch.current() },
            2.8,
          )
          .to(q('[data-hero-arrow]'), { xPercent: 0, yPercent: 0, opacity: 1, duration: 0.9, ease: 'power3.out' }, 2.25)
          .to(q('[data-hero-pill]'), { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.6)' }, 2.35)
          .to(q('[data-hero-scroll]'), { opacity: 1, duration: 1, ease: 'sine.inOut' }, 2.6)
          .add(() => split?.revert()); // back to plain text once the copy has landed
        if (reduce) tl.progress(1);
      });

      if (reduce) return () => off();

      // Scroll-out: photo drifts slower than the page, copy lifts away, the frame recedes.
      const out = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
        defaults: { ease: 'none' },
      });
      out
        .to(q('[data-hero-parallax]'), { yPercent: 16, scale: 1.06 }, 0)
        .to(q('[data-hero-copy]'), { y: () => -window.innerHeight * 0.18, opacity: 0.15 }, 0)
        .to(q('[data-hero-shade]'), { opacity: 0.55 }, 0)
        .to(frame.current, { scale: 0.93, transformOrigin: '50% 100%' }, 0)
        .to(q('[data-hero-arrow-spin]'), { rotate: 90 }, 0);

      // Pointer parallax on the photo and headline.
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
      let onMove: ((e: PointerEvent) => void) | null = null;
      if (fine) {
        const px = gsap.quickTo(q('[data-hero-mouse]'), 'xPercent', { duration: 1.4, ease: 'power3.out' });
        const py = gsap.quickTo(q('[data-hero-mouse]'), 'yPercent', { duration: 1.4, ease: 'power3.out' });
        const tx = gsap.quickTo(q('[data-hero-copy-mouse]'), 'x', { duration: 1.6, ease: 'power3.out' });
        onMove = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          px(nx * -1.6);
          py(ny * -1.6);
          tx(nx * 14);
        };
        root.current!.addEventListener('pointermove', onMove);
      }

      return () => {
        off();
        split?.revert();
        if (onMove) root.current?.removeEventListener('pointermove', onMove);
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className={styles.hero} data-pause-offscreen>
      <div ref={frame} className={styles.frame}>
        {/* CTA disc — sits beneath the photo and shows through its cut-out. */}
        <a
          ref={circle}
          href="#contact"
          className={styles.circle}
          aria-label={hero.cta}
          data-hero-circle
          data-cursor="hover"
        >
          <img width={316} height={316} src="/assets/hero/cta-circle.svg" alt="" className={styles.circleBg} />
          <span className={styles.arrowSpin} data-hero-arrow-spin>
            <span className={styles.arrowSwap} data-hero-arrow>
              <img width={314} height={314} src="/assets/hero/cta-arrow.svg" alt="" />
              <img width={314} height={314} src="/assets/hero/cta-arrow.svg" alt="" aria-hidden />
            </span>
          </span>
        </a>

        <div ref={clip} className={styles.photoClip}>
          <div className={styles.photoReveal} data-hero-reveal>
            <div className={styles.photoParallax} data-hero-parallax>
              <div className={styles.photoMouse} data-hero-mouse>
                <div className={styles.photoZoom} data-hero-zoom>
                  <Image
                    src="/assets/hero/hero-photo.webp"
                    alt="Silver Mercedes-Benz 300 SL Gullwing at dusk"
                    fill
                    priority
                    sizes="100vw"
                    className={styles.photo}
                  />
                </div>
              </div>
            </div>
            <div className={styles.shade} data-hero-shade />
            <div className={styles.cover} data-hero-cover aria-hidden />
          </div>
        </div>

        <div className={styles.copy} data-hero-copy>
          <div data-hero-copy-mouse>
            <h1 className={styles.title}>
              {hero.lines.map((line) => (
                <span key={line} className={styles.lineMask}>
                  <span className={styles.line} data-hero-line>
                    {line}
                  </span>
                </span>
              ))}
            </h1>
            <p className={styles.body} data-hero-body>
              {hero.body}
            </p>
          </div>
        </div>

        <a href="#contact" className={styles.pill} data-hero-pill>
          <span>{hero.cta}</span>
        </a>

        <a href="#road" className={styles.scroll} data-hero-scroll aria-label="Scroll to explore">
          <span className={styles.scrollLine}>
            <span className={styles.scrollTrack}>
              <img width={73} height={6} src="/assets/hero/scroll-line.svg" alt="" />
            </span>
          </span>
          <span className={styles.scrollLabel}>SCROLL</span>
        </a>
      </div>
    </section>
  );
}
