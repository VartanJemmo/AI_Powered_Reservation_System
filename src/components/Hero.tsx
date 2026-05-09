import { useEffect, useRef } from "react";
import hero from "@/assets/hero-cinematic.jpg";
import { QuickReserve } from "./QuickReserve";

export const Hero = () => {
  const imgRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Parallax: background drifts slower than scroll
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (imgRef.current) {
          imgRef.current.style.transform = `translate3d(0, ${y * 0.25}px, 0) scale(${1 + y * 0.0002})`;
        }
        if (titleRef.current) {
          titleRef.current.style.transform = `translate3d(0, ${y * -0.08}px, 0)`;
          titleRef.current.style.opacity = String(Math.max(0, 1 - y / 600));
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const scrollToReserve = () => {
    document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Per-character reveal for the headline
  const headline = "Mayrig";
  const tagline = "A taste of Armenian soul";

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      <div className="absolute inset-0 -top-10 -bottom-10 will-change-transform">
        <img
          ref={imgRef}
          src={hero}
          alt="Mayrig Armenian fine dining table with mezze and warm candlelight"
          className="h-full w-full object-cover"
          width={1920}
          height={1280}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-60" />
      {/* Subtle vignette + film grain */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse at center, transparent 40%, hsl(30 14% 4% / 0.55) 100%)",
      }} />

      <div className="relative z-10 container-narrow pt-28 pb-16 grid lg:grid-cols-[1.1fr_minmax(320px,400px)] gap-10 items-center">
        {/* Headline column */}
        <div className="text-center lg:text-left">
          <span className="eyebrow justify-center lg:justify-start animate-fade-in">
            <span className="gold-divider" /> Beirut · Est. heritage <span className="gold-divider" />
          </span>
          <h1
            ref={titleRef}
            className="mt-5 font-display text-6xl sm:text-7xl md:text-8xl leading-[1.02] will-change-transform"
            aria-label={`${headline}. ${tagline}`}
          >
            <span className="block" aria-hidden>
              {headline.split("").map((ch, i) => (
                <span
                  key={i}
                  className="hero-char inline-block"
                  style={{ animationDelay: `${120 + i * 70}ms` }}
                >
                  {ch}
                </span>
              ))}
            </span>
            <span className="block mt-3 text-2xl sm:text-3xl md:text-4xl gold-text font-display animate-fade-up" style={{ animationDelay: "650ms" }}>
              {tagline}
            </span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "800ms" }}>
            Heritage recipes, hand-crafted mezze and slow-grilled kebabs — served in a candlelit room shaped by generations of family tradition.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center lg:items-start lg:justify-start justify-center gap-3 animate-fade-up" style={{ animationDelay: "950ms" }}>
            <button
              onClick={scrollToReserve}
              className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-primary-foreground px-8 py-4 text-sm uppercase tracking-[0.2em] font-medium shadow-gold animate-pulse-gold"
            >
              Reserve a Table
              <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
            </button>
            <a
              href="#story"
              className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/30 backdrop-blur px-7 py-4 text-sm uppercase tracking-[0.2em] text-foreground/90 hover:border-primary/60 transition-colors"
            >
              Our story
            </a>
          </div>
          <div className="mt-10 flex items-center justify-center lg:justify-start gap-6 text-xs uppercase tracking-widest text-muted-foreground animate-fade-in" style={{ animationDelay: "1100ms" }}>
            <span className="text-primary">★★★★★ 4.9</span>
            <span aria-hidden>·</span>
            <span>Open today · 12:00 PM – 12:00 AM</span>
          </div>
        </div>

      </div>

      <a
        href="#story"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-muted-foreground text-[10px] uppercase tracking-widest hidden sm:flex flex-col items-center gap-2"
      >
        Scroll
        <span className="h-10 w-px bg-primary/60 animate-pulse" />
      </a>
    </section>
  );
};
