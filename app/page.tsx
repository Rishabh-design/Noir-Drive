import Header from '@/components/sections/Header';
import Hero from '@/components/sections/Hero';
import RoadIntro from '@/components/sections/RoadIntro';
import Fleet from '@/components/sections/Fleet';
import Experience from '@/components/sections/Experience';
import Steps from '@/components/sections/Steps';
import Testimonials from '@/components/sections/Testimonials';
import Contact from '@/components/sections/Contact';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <RoadIntro />
        <Fleet />
        <Experience />
        <Steps />
        <Testimonials />
        <Contact />
      </main>
    </>
  );
}
