/**
 * One-shot signals that sequence the opening:
 *   intro — the loading screen has faded; the hero may start its entrance.
 *   heroCta — the hero copy is in; the booking buttons may pop in.
 */
function signal() {
  let fired = false;
  const listeners = new Set<() => void>();
  return {
    fire() {
      if (fired) return;
      fired = true;
      listeners.forEach((fn) => fn());
      listeners.clear();
    },
    on(fn: () => void) {
      if (fired) {
        fn();
        return () => {};
      }
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}

const intro = signal();
const heroCta = signal();

export const markIntroDone = intro.fire;
export const onIntroDone = intro.on;
export const markHeroCta = heroCta.fire;
export const onHeroCta = heroCta.on;
