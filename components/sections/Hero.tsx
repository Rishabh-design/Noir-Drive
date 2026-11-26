'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap, SplitText, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { onIntroDone } from '@/lib/intro';
import { hero } from '@/content/site';
import styles from './Hero.module.css';

/**
 * Builds the hero's silhouette: a rounded frame with a hole around the CTA
 * circle that runs down into the bottom edge (measured from the Figma
 * "Subtract" layer: ring gap 5.5, strip half-width 110/158 r, fillets 9, corners 24).
 */
function heroPath(w: number, h: number, cx: number, cy: number, r: number, unit: number) {
  const R = r + 5.5 * unit;
  const hw = r * (110 / 158);
  const f = 9 * unit;
  const rc = 24 * unit;
  const yj = cy + Math.sqrt(Math.max(R * R - hw * hw, 0));
  const n = (v: number) => Math.round(v * 100) / 100;
  return [
    `M0,${n(rc)}`,
    `A${n(rc)},${n(rc)} 0 0 1 ${n(rc)},0`,
    `L${n(w - rc)},0`,
    `A${n(rc)},${n(rc)} 0 0 1 ${n(w)},${n(rc)}`,
    `L${n(w)},${n(h - rc)}`,
    `A${n(rc)},${n(rc)} 0 0 1 ${n(w - rc)},${n(h)}`,
    `L${n(cx + hw + f)},${n(h)}`,
    `A${n(f)},${n(f)} 0 0 1 ${n(cx + hw)},${n(h - f)}`,
    `L${n(cx + hw)},${n(yj)}`,
    `A${n(R)},${n(R)} 0 1 0 ${n(cx - hw)},${n(yj)}`,
    `L${n(cx - hw)},${n(h - f)}`,
    `A${n(f)},${n(f)} 0 0 1 ${n(cx - hw - f)},${n(h)}`,
    `L${n(rc)},${n(h)}`,
    `A${n(rc)},${n(rc)} 0 0 1 0,${n(h - rc)}`,
    'Z',
  ].join(' ');
}

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const circle = useRef<HTMLAnchorElement>(null);
  const clip = useRef<HTMLDivElement>(null);

  // Keep the cut-out silhouette glued to the CTA circle at every viewport size.
  useEffect(() => {
    const f = frame.current;
    const c = circle.current;
    const cl = clip.current;
    if (!f || !c || !cl) return;
    const update = () => {
      const unit = parseFloat(getComputedStyle(document.documentElement).fontSize) / 10;
      const w = f.offsetWidth;
      const h = f.offsetHeight;
      const r = c.offsetWidth / 2;
      const cx = c.offsetLeft + r;
      const cy = c.offsetTop + r;
      cl.style.clipPath = `path('${heroPath(w, h, cx, cy, r, unit)}')`;
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(f);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const lines = q('[data-hero-line]');
      const body = q('[data-hero-body]')[0];
      const reduce = prefersReducedMotion();

      // Resting state before the curtain lifts.
      gsap.set(q('[data-hero-reveal]'), { clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(q('[data-hero-zoom]'), { scale: 1.35 });
      gsap.set(lines, { yPercent: 115, rotate: 4 });
      gsap.set(q('[data-hero-circle]'), { scale: 0.3, rotate: -140, opacity: 0 });
      gsap.set(q('[data-hero-arrow]'), { xPercent: -40, yPercent: 40, opacity: 0 });
      gsap.set(q('[data-hero-pill]'), { xPercent: 18, opacity: 0 });
      gsap.set(q('[data-hero-scroll]'), { opacity: 0, y: 20 });

      let split: SplitText | null = null;
      const off = onIntroDone(() => {
        split = SplitText.create(body, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
        const tl = gsap.timeline({ defaults: { ease: 'noirOut' } });
        tl.to(q('[data-hero-reveal]'), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'noir' }, 0)
          .to(q('[data-hero-zoom]'), { scale: 1, duration: 2.6, ease: 'expo.out' }, 0.1)
          .to(lines, { yPercent: 0, rotate: 0, duration: 1.6, stagger: 0.11 }, 0.55)
          .from(split.lines, { yPercent: 100, opacity: 0, duration: 1.3, stagger: 0.08 }, 0.95)
          .to(q('[data-hero-circle]'), { scale: 1, rotate: 0, opacity: 1, duration: 1.8 }, 0.85)
          .to(q('[data-hero-arrow]'), { xPercent: 0, yPercent: 0, opacity: 1, duration: 1.4 }, 1.25)
          .to(q('[data-hero-pill]'), { xPercent: 0, opacity: 1, duration: 1.3 }, 1.3)
          .to(q('[data-hero-scroll]'), { opacity: 1, y: 0, duration: 1.2 }, 1.5);
        if (reduce) tl.progress(1);
      });

      if (reduce) return () => off();

      // Scroll-out: photo drifts slower than the page, copy lifts away, the frame recedes.
      const out = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
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
        const px = gsap.quickTo(q('[data-hero-mouse]'), 'xPercent', { duration: 1.6, ease: 'power3.out' });
        const py = gsap.quickTo(q('[data-hero-mouse]'), 'yPercent', { duration: 1.6, ease: 'power3.out' });
        const tx = gsap.quickTo(q('[data-hero-copy-mouse]'), 'x', { duration: 1.8, ease: 'power3.out' });
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
    <section ref={root} id="top" className={styles.hero}>
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
          <img src="/assets/hero/cta-circle.svg" alt="" className={styles.circleBg} />
          <span className={styles.arrowSpin} data-hero-arrow-spin>
            <span className={styles.arrowSwap} data-hero-arrow>
              <img src="/assets/hero/cta-arrow.svg" alt="" />
              <img src="/assets/hero/cta-arrow.svg" alt="" aria-hidden />
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
            <img src="/assets/hero/scroll-line.svg" alt="" />
          </span>
          <span className={styles.scrollLabel}>SCROLL</span>
        </a>
      </div>
    </section>
  );
}
