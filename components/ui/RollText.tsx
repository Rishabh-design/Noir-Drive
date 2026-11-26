import styles from './RollText.module.css';

/** Label that rolls up to a fresh copy of itself on hover (parent needs the `roll-host` hover). */
export default function RollText({ children }: { children: string }) {
  return (
    <span className={styles.roll} data-roll>
      <span className={styles.track}>
        <span>{children}</span>
        <span aria-hidden>{children}</span>
      </span>
    </span>
  );
}
