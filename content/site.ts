/**
 * All copy and data for the NoirDrive homepage, taken from the Figma frame
 * "Rental Luxury Car Website" (Regular-Post, node 184:33).
 */

export const nav = [
  { label: 'Experience', href: '#experience' },
  { label: 'Fleet', href: '#fleet' },
  { label: 'Contact Us', href: '#contact' },
];

export const hero = {
  lines: ['Rent the', 'World’s Most', 'Iconic Cars'],
  body: 'Experience the thrill of driving world-class sports and luxury cars without owning them. Choose from Ferraris, Lamborghinis, Rolls-Royce and more.',
  cta: 'Book Your Ride',
};

export const roadIntro = {
  lines: ['The road is ordinary.', 'The car you choose shouldn’t be.'],
  // Positions are the tile's top-left corner inside the 1728 × 1117 Figma frame.
  tiles: [
    { src: '/assets/road/tile-1.webp', alt: 'Yellow Lamborghini Urus', x: 120, y: 283, depth: 0.9 },
    { src: '/assets/road/tile-7.webp', alt: 'Gold Lamborghini Sián', x: 568, y: 226, depth: 0.5 },
    { src: '/assets/road/tile-8.webp', alt: 'White Rolls-Royce Ghost', x: 936, y: 343, depth: 0.7 },
    { src: '/assets/road/tile-3.webp', alt: 'Silver Mercedes-AMG GT', x: 1404, y: 361, depth: 1 },
    { src: '/assets/road/tile-6.webp', alt: 'Gold Rolls-Royce Phantom', x: 634, y: 596, depth: 0.6 },
    { src: '/assets/road/tile-2.webp', alt: 'White Lamborghini Huracán', x: 1217, y: 614, depth: 0.8 },
    { src: '/assets/road/tile-5.webp', alt: 'Red Audi R8', x: 214, y: 756, depth: 1.1 },
    { src: '/assets/road/tile-4.webp', alt: 'Red Ferrari 458', x: 1473, y: 749, depth: 0.75 },
  ],
};

export type Car = {
  name: string;
  tag: string;
  subtitle: string;
  price: string;
  image: string;
  /** object-position for the photo inside the card */
  focus?: string;
};

// Order = carousel order. The Rolls-Royce opens in the centre slot, as in the design.
// Only the Rolls-Royce card is fully legible in Figma; the other cards reuse its
// placeholder copy ("Italian Lightweight Performance", "$420 / day").
export const fleet: Car[] = [
  { name: 'Mercedes-AMG GT', tag: 'Sports Coupe', subtitle: 'Italian Lightweight Performance', price: '$420', image: '/assets/fleet/mercedes-amg-gt.webp', focus: '50% 62%' },
  { name: 'Lamborghini Aventador', tag: 'Sports Coupe', subtitle: 'Italian Lightweight Performance', price: '$420', image: '/assets/fleet/lamborghini-aventador.webp', focus: '50% 60%' },
  { name: 'Rolls Royce', tag: 'Luxury', subtitle: 'Italian Lightweight Performance', price: '$420', image: '/assets/fleet/rolls-royce-phantom.webp', focus: '50% 50%' },
  { name: 'Lamborghini Huracán', tag: 'Sports Coupe', subtitle: 'Italian Lightweight Performance', price: '$420', image: '/assets/fleet/lamborghini-huracan.webp', focus: '50% 70%' },
  { name: 'Lamborghini SVJ', tag: 'Sports Coupe', subtitle: 'Italian Lightweight Performance', price: '$420', image: '/assets/fleet/lamborghini-svj.webp', focus: '50% 55%' },
  { name: 'McLaren 720S', tag: 'Sports Coupe', subtitle: 'Italian Lightweight Performance', price: '$420', image: '/assets/fleet/mclaren-720s.webp', focus: '50% 62%' },
];

export const fleetIntro = {
  eyebrow: 'OUR COLLECTION',
  title: 'Exceptional Fleet',
  body: 'Curated selection of the world’s most prestigious automobiles, meticulously maintained for your ultimate driving pleasure.',
  cta: 'Explore Full Collection',
};

export const experience = {
  eyebrow: 'THE NOIRDRIVE DIFFERENCE',
  title: 'Unparalleled Experience',
  body: 'More than just a rental service – we deliver extraordinary moments behind the wheel of automotive excellence.',
  features: [
    { icon: '/assets/experience/icon-shield.svg', title: 'Premium Insurance', body: 'Comprehensive coverage included with every rental for complete peace of mind.' },
    { icon: '/assets/experience/icon-clock.svg', title: '24/7 Concierge', body: 'Round-the-clock support and delivery service wherever you are.' },
    { icon: '/assets/experience/icon-star.svg', title: 'Expertly Maintained', body: 'Every vehicle is meticulously serviced to perfection before each journey.' },
    { icon: '/assets/experience/icon-headset.svg', title: 'Personal Service', body: 'Dedicated account managers to curate your perfect driving experience.' },
  ],
  stats: [
    { value: 150, decimals: 0, suffix: '+', label: 'Luxury Vehicles' },
    { value: 15, decimals: 0, suffix: 'K+', label: 'Happy Clients' },
    { value: 25, decimals: 0, suffix: '+', label: 'Countries' },
    { value: 99.8, decimals: 1, suffix: '%', label: 'Satisfaction' },
  ],
};

export const steps = {
  title: 'Get Your History In Hand With Only Three Simple Steps',
  items: [
    { n: '01', title: 'Select Your Car', body: 'Browse our curated collection and choose the perfect vehicle for your journey.' },
    { n: '02', title: 'Book Your Dates', body: 'Pick your dates and delivery point – we confirm availability instantly and handle the paperwork.' },
    { n: '03', title: 'Drive in Style', body: 'Your car arrives detailed, fuelled and insured, wherever you are. All that is left is the road.' },
  ],
  slider: 'Slide To Book Your Ride',
  image: '/assets/steps/steps-car.webp',
};

export const testimonials = {
  eyebrow: 'CLIENT STORIES',
  title: 'What Our Clients Say',
  items: [
    {
      quote: '“The attention to detail and level of service is unmatched. NoirDrive made my Monaco trip unforgettable with the perfect Lamborghini experience.”',
      name: 'Alexander Chen',
      role: 'CEO, Tech Ventures',
      avatar: '/assets/testimonials/alexander-chen.webp',
    },
    {
      quote: '“Impeccable service from start to finish. The Rolls-Royce was pristine, and the concierge team anticipated every need. Truly luxury redefined.”',
      name: 'Isabella Rodriguez',
      role: 'Fashion Director',
      avatar: '/assets/testimonials/isabella-rodriguez.webp',
    },
    {
      quote: '“Been using NoirDrive for years. Their fleet is exceptional, delivery is seamless, and every car is in pristine condition. The only service I trust.”',
      name: 'James Morrison',
      role: 'Investment Banker',
      avatar: '/assets/testimonials/james-morrison.webp',
    },
  ],
};

export const contact = {
  eyebrow: 'GET IN TOUCH',
  title: 'Start Your Journey',
  body: 'Ready to experience automotive excellence? Our team is here to help you find the perfect vehicle for your next adventure.',
  items: [
    { icon: '/assets/contact/icon-pin.svg', title: 'Headquarters', value: '123 Luxury Lane, Monaco 98000' },
    { icon: '/assets/contact/icon-phone.svg', title: '24/7 Concierge', value: '+377 99 99 9999', href: 'tel:+37799999999' },
    { icon: '/assets/contact/icon-mail.svg', title: 'Email', value: 'concierge@noirdrive.com', href: 'mailto:concierge@noirdrive.com' },
  ],
  socials: [
    { icon: '/assets/contact/icon-instagram.svg', label: 'Instagram', href: '#' },
    { icon: '/assets/contact/icon-facebook.svg', label: 'Facebook', href: '#' },
    { icon: '/assets/contact/icon-twitter.svg', label: 'Twitter', href: '#' },
  ],
};

export const footer = {
  tagline: 'The world’s premier luxury and exotic car rental service.',
  columns: [
    { title: 'EXPLORE', links: [
      { label: 'Fleet', href: '#fleet' },
      { label: 'Experience', href: '#experience' },
      { label: 'Locations', href: '#contact' },
      { label: 'About Us', href: '#experience' },
    ] },
    { title: 'SUPPORT', links: [
      { label: 'FAQ', href: '#steps' },
      { label: 'Booking Guide', href: '#steps' },
      { label: 'Insurance', href: '#experience' },
      { label: 'Contact', href: '#contact' },
    ] },
    { title: 'LEGAL', links: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ] },
  ],
  copyright: '© 2026 NoirDrive. All rights reserved.',
  signoff: 'Designed for those who demand excellence.',
};
