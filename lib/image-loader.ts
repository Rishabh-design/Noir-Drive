import manifest from './image-manifest.json';

const sizes = manifest as Record<string, number[]>;

/**
 * next/image loader for pre-generated static variants (scripts/image-variants.py:
 * name.webp → name.<width>.webp). No server-side resizing at request time, so images
 * are served straight from disk/CDN with long-lived caching.
 * Picks the smallest variant at least as wide as requested, else the original.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const widths = sizes[src];
  if (!widths) return src;
  const w = widths.find((x) => x >= width);
  return w ? src.replace(/\.webp$/, `.${w}.webp`) : src;
}
