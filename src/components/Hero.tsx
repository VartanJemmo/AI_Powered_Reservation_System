import hero from "@/assets/hero.jpg";

export const Hero = () => {
  const scrollToReserve = () => {
    document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      <img
        src={hero}
        alt="Mayrig Armenian fine dining table with mezze and warm candlelight"
        className="absolute inset-0 h-full w-full object-cover"
        width={1920}
        height={1280}
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-70" />

      <div className="relative z-10 container-narrow text-center pt-24 pb-20 animate-fade-up">
        <span className="eyebrow justify-center">
          <span className="gold-divider" /> Beirut · Est. heritage <span className="gold-divider" />
        </span>
        <h1 className="mt-5 font-display text-5xl sm:text-6xl md:text-7xl leading-[1.05]">
          Mayrig
          <span className="block mt-2 text-3xl sm:text-4xl md:text-5xl gold-text font-display">
            A taste of Armenian soul
          </span>
        </h1>
        <p className="mt-6 max-w-xl mx-auto text-base sm:text-lg text-muted-foreground">
          Heritage recipes, hand-crafted mezze and slow-grilled kebabs — served in a candlelit room
          shaped by generations of family tradition.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={scrollToReserve}
            className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-gradient-gold text-primary-foreground px-8 py-4 text-sm uppercase tracking-[0.2em] font-medium shadow-gold animate-pulse-gold"
          >
            Reserve a Table
            <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
          </button>
          <a
            href="#menu"
            className="inline-flex items-center gap-2 rounded-full border border-border/80 px-7 py-4 text-sm uppercase tracking-[0.2em] text-foreground/90 hover:border-primary/60 transition-colors"
          >
            Explore the menu
          </a>
        </div>
        <div className="mt-12 flex items-center justify-center gap-8 text-xs uppercase tracking-widest text-muted-foreground">
          <span>★★★★★ 4.9</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Open today · 18:00 – 23:00</span>
        </div>
      </div>

      <a
        href="#about"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-muted-foreground text-xs uppercase tracking-widest hidden sm:flex flex-col items-center gap-2"
      >
        Scroll
        <span className="h-10 w-px bg-primary/60" />
      </a>
    </section>
  );
};
