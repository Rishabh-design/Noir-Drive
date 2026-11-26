import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import SmoothScroll from '@/components/motion/SmoothScroll';
import Cursor from '@/components/motion/Cursor';
import Preloader from '@/components/motion/Preloader';
import OffscreenPause from '@/components/motion/OffscreenPause';
import './globals.css';

const clash = localFont({
  src: [
    { path: '../public/fonts/ClashDisplay-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/ClashDisplay-Medium.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--font-clash',
  display: 'swap',
});

// Only the weights the design uses (300 light copy, 400, 500, 600). The one italic
// ("Insurance Included") is a separate, non-preloaded face — 5 files instead of 10.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal'],
  variable: '--font-poppins',
  display: 'swap',
});

const poppinsItalic = Poppins({
  subsets: ['latin'],
  weight: ['500'],
  style: ['italic'],
  variable: '--font-poppins-italic',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'NoirDrive — Rent the World’s Most Iconic Cars',
  description:
    'Experience the thrill of driving world-class sports and luxury cars without owning them. Ferraris, Lamborghinis, Rolls-Royce and more, delivered with 24/7 concierge.',
};

export const viewport: Viewport = {
  themeColor: '#171717',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${clash.variable} ${poppins.variable} ${poppinsItalic.variable}`}>
      <body>
        <Preloader />
        <SmoothScroll />
        <Cursor />
        {children}
        <OffscreenPause />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
