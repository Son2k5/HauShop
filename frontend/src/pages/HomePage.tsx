import HeroBanner from "../components/home/HeroBanner";
import MarqueeBar from "../components/layout/Marqueebar";
import TrustBar from "../components/home/TrustBar";
import BestSellers from "../components/home/BestSellers";
import HomeProductSections from "../components/home/HomeProductSections";
import DarkStrip from "../components/home/DarkStrip";
import Newsletter from "../components/home/Newsletter";



export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroBanner />
        <MarqueeBar />
        <TrustBar />
        <BestSellers />
        <HomeProductSections />
        <DarkStrip />
        <Newsletter />
      </main>
    </div>
  );
}
