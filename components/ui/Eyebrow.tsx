import clsx from '@/lib/clsx';
import styles from './Eyebrow.module.css';

type Rule = { src: string; flip?: boolean };

type Props = {
  text: string;
  /** Rule shown left of the label. `flip` mirrors it horizontally, as the Figma layer does. */
  left?: Rule;
  right?: Rule;
  tone?: 'light' | 'dark' | 'muted' | 'white';
  /** Space between rules and label, in design px (Figma varies it per section). */
  gap?: number;
  className?: string;
};

/** "——• LABEL •——" kicker that sits above every section title. */
export default function Eyebrow({ text, left, right, tone = 'dark', gap, className }: Props) {
  return (
    <div
      className={clsx(styles.eyebrow, styles[tone], className)}
      style={gap ? { gap: `${gap / 10}rem` } : undefined}
      data-eyebrow
    >
      {left && (
        <span className={clsx(styles.line, styles.lineLeft)} data-eyebrow-line>
          <img src={left.src} alt="" className={clsx(left.flip && styles.flip)} />
        </span>
      )}
      <span className={styles.labelMask}>
        <span className={styles.label} data-eyebrow-label>
          {text}
        </span>
      </span>
      {right && (
        <span className={clsx(styles.line, styles.lineRight)} data-eyebrow-line>
          <img src={right.src} alt="" className={clsx(right.flip && styles.flip)} />
        </span>
      )}
    </div>
  );
}
