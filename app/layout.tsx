import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';
import SmoothScroll from '@/components/motion/SmoothScroll';
import Cursor from '@/components/motion/Cursor';
import Preloader from '@/components/motion/Preloader';
import './globals.css';

const clash = localFont({
  src: [
    { path: '../public/fonts/ClashDisplay-Regular.otf', weight: '400', style: 'normal' },
    { path: '../public/fonts/ClashDisplay-Medium.otf', weight: '500', style: 'normal' },
  ],
  variable: '--font-clash',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
  display: 'swap',
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
    <html lang="en" className={`${clash.variable} ${poppins.variable}`}>
      <body>
        <Preloader />
        <SmoothScroll />
        <Cursor />
        {children}
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
