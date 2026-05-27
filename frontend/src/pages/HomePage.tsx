import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import HeroBanner from "../components/home/HeroBanner";
import MarqueeBar from "../components/layout/Marqueebar";
import TrustBar from "../components/home/TrustBar";

const BestSellers = lazy(() => import("../components/home/BestSellers"));
const HomeProductSections = lazy(() => import("../components/home/HomeProductSections"));
const DarkStrip = lazy(() => import("../components/home/DarkStrip"));
const Newsletter = lazy(() => import("../components/home/Newsletter"));

function SectionFallback({ minHeight }: { minHeight: number }) {
  return (
    <div className="mx-auto max-w-container px-4 py-12 sm:px-6 lg:px-10" style={{ minHeight }}>
      <div className="h-8 w-52 animate-pulse rounded bg-gray-100" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

function LazySection({
  children,
  minHeight = 360,
  rootMargin = "250px 0px",
  idleDelay = 0,
  activationDelay = 0,
}: {
  children: ReactNode;
  minHeight?: number;
  rootMargin?: string;
  idleDelay?: number;
  activationDelay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [delayPassed, setDelayPassed] = useState(activationDelay <= 0);
  const [shouldActivate, setShouldActivate] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (delayPassed) return;

    const timeout = window.setTimeout(() => setDelayPassed(true), activationDelay);
    return () => window.clearTimeout(timeout);
  }, [activationDelay, delayPassed]);

  useEffect(() => {
    if (shouldActivate || !delayPassed || !isNearViewport) return;

    setShouldActivate(true);
  }, [delayPassed, isNearViewport, shouldActivate]);

  useEffect(() => {
    if (shouldActivate || isNearViewport) return;

    const element = ref.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isNearViewport, rootMargin, shouldActivate]);

  useEffect(() => {
    if (!shouldActivate || shouldRender) return;

    const render = () => setShouldRender(true);

    if (idleDelay <= 0) {
      render();
      return;
    }

    const timeout = window.setTimeout(render, idleDelay);
    return () => window.clearTimeout(timeout);
  }, [idleDelay, shouldActivate, shouldRender]);

  return (
    <div ref={ref} style={!shouldRender ? { minHeight } : undefined}>
      {shouldRender ? (
        <Suspense fallback={<SectionFallback minHeight={minHeight} />}>
          {children}
        </Suspense>
      ) : shouldActivate ? (
        <SectionFallback minHeight={minHeight} />
      ) : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <main>
        <HeroBanner />
        <MarqueeBar />
        <TrustBar />
        <LazySection
          minHeight={760}
          rootMargin="0px 0px -120px 0px"
          idleDelay={250}
        >
          <BestSellers />
        </LazySection>
        <LazySection
          minHeight={2100}
          rootMargin="0px 0px -160px 0px"
          idleDelay={350}
        >
          <HomeProductSections />
        </LazySection>
        <LazySection minHeight={360}>
          <DarkStrip />
        </LazySection>
        <LazySection minHeight={320}>
          <Newsletter />
        </LazySection>
      </main>
    </div>
  );
}
