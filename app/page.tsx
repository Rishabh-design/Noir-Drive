import Header from '@/components/sections/Header';
import Hero from '@/components/sections/Hero';
import RoadIntro from '@/components/sections/RoadIntro';
import Fleet from '@/components/sections/Fleet';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <RoadIntro />
        <Fleet />
        <div style={{ height: '100vh' }} />
      </main>
    </>
  );
}
