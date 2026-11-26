'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { whenIdle } from '@/lib/idle';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { contact, footer } from '@/content/site';
import { revealChars, revealLines } from '@/components/motion/reveal';
import Magnetic from '@/components/ui/Magnetic';
import RollText from '@/components/ui/RollText';
import styles from './Contact.module.css';

const WORDMARK = 'NoirDrive';

/** Dark finale (Figma "Frame 37"): inquiry, the NoirDrive wordmark over the dunes, footer. */
export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [sent, setSent] = useState(false);

  // Below the fold: set up in an idle slice after hydration (see lib/idle.ts).
  useGSAP(
    (_ctx, contextSafe) =>
      whenIdle(
        contextSafe!(() => {
          const q = gsap.utils.selector(root);
          const reduce = prefersReducedMotion();

          revealChars(q('[data-ct-title]')[0], q('[data-ct-left]')[0], { start: 'top 75%', delay: 0.1 });
          revealLines(q('[data-ct-body]')[0], q('[data-ct-left]')[0], { start: 'top 75%', delay: 0.3 });
          if (reduce) return;

          // The glow eases in once as the section arrives, then stays put.
          gsap.from(q('[data-ct-glow]'), {
            opacity: 0,
            duration: 2.4,
            ease: 'sine.inOut',
            scrollTrigger: { trigger: root.current, start: 'top 70%', once: true },
          });

          const left = gsap.timeline({ scrollTrigger: { trigger: q('[data-ct-left]')[0], start: 'top 75%', once: true } });
          left
            .from(q('[data-ct-eyebrow] > *'), { yPercent: 100, opacity: 0, duration: 1, stagger: 0.1 }, 0)
            .from(q('[data-ct-rule]'), { scaleX: 0, duration: 1.4, ease: 'noir' }, 0.1)
            .from(q('[data-ct-item]'), { x: -50, opacity: 0, duration: 1.2, stagger: 0.12 }, 0.5)
            .from(q('[data-ct-follow]'), { y: 20, opacity: 0, duration: 1 }, 0.9)
            .from(q('[data-ct-social]'), { scale: 0, rotate: -90, duration: 1, stagger: 0.08, ease: 'back.out(2)' }, 1);

          gsap
            .timeline({ scrollTrigger: { trigger: q('[data-ct-form]')[0], start: 'top 80%', once: true } })
            .from(q('[data-ct-form]'), { y: 120, opacity: 0, rotateX: 12, duration: 1.6, ease: 'noirOut' })
            .from(q('[data-ct-field]'), { y: 30, opacity: 0, duration: 1, stagger: 0.08 }, 0.35);

          // The wordmark rises out from behind the dunes; the dunes drift slower.
          gsap.fromTo(
            q('[data-ct-char]'),
            { yPercent: 85 },
            {
              yPercent: 0,
              ease: 'none',
              stagger: 0.06,
              // Finishes as the page bottom is reached, so the letters land fully on every screen.
              scrollTrigger: {
                trigger: q('[data-ct-wordmark]')[0],
                start: 'top bottom',
                endTrigger: root.current,
                end: 'bottom bottom',
                scrub: 1,
              },
            },
          );
          gsap.fromTo(
            q('[data-ct-hills]'),
            { yPercent: 8 },
            {
              yPercent: 0,
              ease: 'none',
              // Settles exactly at the end of the page, leaving the ridge across the letters.
              scrollTrigger: {
                trigger: q('[data-ct-wordmark]')[0],
                start: 'top bottom',
                endTrigger: root.current,
                end: 'bottom bottom',
                scrub: true,
              },
            },
          );

          gsap
            .timeline({ scrollTrigger: { trigger: q('[data-ct-footer]')[0], start: 'top 85%', once: true } })
            .from(q('[data-ct-col]'), { y: 40, opacity: 0, duration: 1.2, stagger: 0.1 })
            .from(q('[data-ct-base-rule]'), { scaleX: 0, duration: 1.6, ease: 'noir' }, 0.2)
            .from(q('[data-ct-base] > p'), { y: 16, opacity: 0, duration: 1, stagger: 0.1 }, 0.5);
        }),
      ),
    { scope: root },
  );

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSent(true);
    form.reset();
    gsap.fromTo(
      form.querySelector('[data-ct-submit]'),
      { scale: 0.96 },
      { scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)' },
    );
    gsap.delayedCall(4, () => setSent(false));
  };

  return (
    <section ref={root} id="contact" className={styles.section} data-pause-offscreen>
      {/* Figma Group 7 glow + its grain, pre-rendered and static (no per-frame filter work). */}
      <div className={styles.glow} data-ct-glow aria-hidden>
        <img width={864} height={800} src="/assets/contact/glow.webp" alt="" loading="lazy" decoding="async" />
        <span className={styles.glowGrain} />
      </div>

      <div className={styles.contact}>
        <div className={styles.left} data-ct-left>
          <div className={styles.eyebrow} data-ct-eyebrow>
            <span>{contact.eyebrow}</span>
            <span className={styles.rule} data-ct-rule>
              <img width={115} height={3} src="/assets/contact/eyebrow-line.svg" alt="" />
            </span>
          </div>
          <h2 className={styles.title} data-ct-title>
            {contact.title}
          </h2>
          <p className={styles.body} data-ct-body>
            {contact.body}
          </p>

          <ul className={styles.items}>
            {contact.items.map((item) => {
              const inner = (
                <>
                  <img width={42} height={42} src={item.icon} alt="" className={styles.itemIcon} />
                  <span className={styles.itemText}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <span className={styles.itemValue}>{item.value}</span>
                  </span>
                </>
              );
              return (
                <li key={item.title} data-ct-item>
                  {item.href ? (
                    <a href={item.href} className={styles.item}>
                      {inner}
                    </a>
                  ) : (
                    <div className={styles.item}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>

          <div className={styles.follow}>
            <p className={styles.followTitle} data-ct-follow>
              FOLLOW US
            </p>
            <div className={styles.socials}>
              {contact.socials.map((s) => (
                <Magnetic key={s.label} strength={0.4}>
                  <a href={s.href} className={styles.social} aria-label={s.label} data-ct-social>
                    <img width={35} height={35} src={s.icon} alt="" />
                  </a>
                </Magnetic>
              ))}
            </div>
          </div>
        </div>

        <form className={styles.form} onSubmit={onSubmit} data-ct-form>
          <div className={styles.nameRow}>
            <label className={styles.field} data-ct-field>
              <span className={styles.label}>First Name</span>
              <input name="firstName" autoComplete="given-name" placeholder="John" required />
            </label>
            <label className={styles.field} data-ct-field>
              <span className={styles.label}>Last Name</span>
              <input name="lastName" autoComplete="family-name" placeholder="Doe" />
            </label>
          </div>
          <label className={styles.field} data-ct-field>
            <span className={styles.label}>Email</span>
            <input name="email" type="email" autoComplete="email" placeholder="john@example.com" required />
          </label>
          <label className={styles.field} data-ct-field>
            <span className={styles.label}>Phone</span>
            <input name="phone" type="tel" autoComplete="tel" placeholder="+1 (555) 000-0000" />
          </label>
          <label className={styles.field} data-ct-field>
            <span className={styles.label}>Message</span>
            <textarea name="message" placeholder="Tell us about your ideal driving experience..." data-lenis-prevent />
          </label>
          <button type="submit" className={styles.submit} data-ct-field data-ct-submit>
            <span className={styles.submitText} data-sent={sent || undefined}>
              <span>Send Inquiry</span>
              <span aria-hidden={!sent}>Inquiry received — we’ll be in touch</span>
            </span>
          </button>
          <p className="sr-only" aria-live="polite">
            {sent ? 'Thank you. Your inquiry has been received.' : ''}
          </p>
        </form>
      </div>

      {/* Finale: the NoirDrive wordmark rises letter by letter from behind the meadows. */}
      <div className={styles.finale}>
      <div className={styles.hills} data-ct-hills aria-hidden>
        <Image src="/assets/contact/hills.webp" alt="" fill sizes="(min-width: 900px) 100vw, 160vw" className={styles.hillsImg} />
      </div>

      <div className={styles.wordmark} data-ct-wordmark aria-hidden>
        {Array.from(WORDMARK).map((ch, i) => (
          <span key={i} className={styles.wordmarkChar} data-ct-char>
            {ch}
          </span>
        ))}
      </div>

      <footer className={styles.footer} data-ct-footer>
        <div className={styles.cols}>
          <div className={styles.brand} data-ct-col>
            <img src="/assets/brand/logo.svg" alt="NoirDrive" className={styles.footLogo} width={219} height={23} />
            <p className={styles.tagline}>{footer.tagline}</p>
          </div>
          {footer.columns.map((col) => (
            <div key={col.title} className={styles.col} data-ct-col>
              <h3 className={styles.colTitle}>{col.title}</h3>
              <ul className={styles.links}>
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={styles.link}>
                      <RollText>{l.label}</RollText>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.base} data-ct-base>
          <span className={styles.baseRule} data-ct-base-rule aria-hidden />
          <p>{footer.copyright}</p>
          <p>{footer.signoff}</p>
        </div>
      </footer>
      </div>
    </section>
  );
}
