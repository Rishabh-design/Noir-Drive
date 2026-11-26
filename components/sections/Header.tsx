'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { onHeroCta, onIntroDone } from '@/lib/intro';
import { nav } from '@/content/site';
import Magnetic from '@/components/ui/Magnetic';
import RollText from '@/components/ui/RollText';
import styles from './Header.module.css';

/**
 * Floating header. Sits transparent over the hero exactly as in Figma, then
 * condenses into a dark glass bar once the hero is passed, hiding on scroll
 * down and returning on scroll up.
 */
export default function Header() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const items = el.querySelectorAll('[data-header-item]');
      const cta = el.querySelector('[data-header-cta]');
      gsap.set(items, { y: -24, opacity: 0 });
      gsap.set(cta, { scale: 0.6, opacity: 0 });

      // Logo and links settle in with the hero copy…
      const off = onIntroDone(() => {
        gsap.to(items, { y: 0, opacity: 1, duration: 1.3, stagger: 0.06, ease: 'power3.out', delay: 0.4 });
      });
      // …the "Reserve" pill pops in together with the hero's booking disc.
      const offCta = onHeroCta(() => {
        gsap.to(cta, { scale: 1, opacity: 1, duration: 0.9, ease: 'back.out(1.7)', delay: 0.45 });
      });

      let hidden = false;
      const st = ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate(self) {
          const y = self.scroll();
          el.classList.toggle(styles.solid, y > window.innerHeight * 0.55);
          const shouldHide = self.direction === 1 && y > window.innerHeight * 1.1;
          if (shouldHide !== hidden) {
            hidden = shouldHide;
            gsap.to(el, { yPercent: hidden ? -130 : 0, duration: 0.8, ease: 'noir', overwrite: 'auto' });
          }
        },
      });

      return () => {
        off();
        offCta();
        st.kill();
      };
    },
    { scope: root },
  );

  return (
    <header ref={root} className={styles.header}>
      <div className={styles.bar}>
        <a href="#top" className={styles.logo} aria-label="NoirDrive home" data-header-item>
          <img src="/assets/brand/logo.svg" alt="NoirDrive" width={219} height={23} />
        </a>

        <nav className={styles.nav} aria-label="Primary">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink} data-header-item>
              <RollText>{item.label}</RollText>
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <Magnetic strength={0.25}>
            <a href="#contact" className={styles.bookNow} data-header-cta>
              <span className={styles.bookLabel}>
                <RollText>Reserve</RollText>
              </span>
              <span className={styles.bookDot}>
                <img width={45} height={45} src="/assets/hero/book-now-dot.svg" alt="" className={styles.bookDotBg} />
                <span className={styles.arrowSwap}>
                  <img width={33} height={33} src="/assets/hero/book-now-arrow.svg" alt="" />
                  <img width={33} height={33} src="/assets/hero/book-now-arrow.svg" alt="" aria-hidden />
                </span>
              </span>
            </a>
          </Magnetic>
        </div>
      </div>
    </header>
  );
}
