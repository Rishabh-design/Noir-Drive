'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { onIntroDone } from '@/lib/intro';
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
      gsap.set(items, { yPercent: -140, opacity: 0 });

      const off = onIntroDone(() => {
        gsap.to(items, { yPercent: 0, opacity: 1, duration: 1.4, stagger: 0.07, ease: 'noirOut', delay: 0.55 });
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
            <a href="#contact" className={styles.bookNow} data-header-item>
              <span className={styles.bookLabel}>
                <RollText>Book Now</RollText>
              </span>
              <span className={styles.bookDot}>
                <img src="/assets/hero/book-now-dot.svg" alt="" className={styles.bookDotBg} />
                <span className={styles.arrowSwap}>
                  <img src="/assets/hero/book-now-arrow.svg" alt="" />
                  <img src="/assets/hero/book-now-arrow.svg" alt="" aria-hidden />
                </span>
              </span>
            </a>
          </Magnetic>
          <Magnetic strength={0.3}>
            <a href="#contact" className={styles.user} aria-label="Client portal" data-header-item>
              <img src="/assets/hero/user.svg" alt="" />
            </a>
          </Magnetic>
        </div>
      </div>
    </header>
  );
}
