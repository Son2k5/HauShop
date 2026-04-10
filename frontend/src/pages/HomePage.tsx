import PromoBar from "../components/layout/Promobar";
import Header from "../components/layout/Header";
import HeroBanner from "../components/home/HeroBanner";
import MarqueeBar from "../components/layout/Marqueebar";
import TrustBar from "../components/home/TrustBar";
import BestSellers from "../components/home/BestSellers";
import DarkStrip from "../components/home/DarkStrip";
import Newsletter from "../components/home/NewsLetter";
import Footer from "../components/layout/Footer";



export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroBanner />
        <MarqueeBar />
        <TrustBar />
        <BestSellers />
        <DarkStrip />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}