import { useEffect, useRef, useState } from "react";
import hands from "@/assets/story-hands.jpg";
import pomegranate from "@/assets/story-pomegranate.jpg";
import grill from "@/assets/story-grill.jpg";
import baklava from "@/assets/story-baklava.jpg";

const CHAPTERS = [
  {
    img: hands,
    eyebrow: "Chapter I · Heritage",
    title: "Hands that remember",
    body: "Recipes carried from Anatolia in 1915 — kneaded by mothers, taught to daughters, served tonight at your table.",
  },
  {
    img: pomegranate,
    eyebrow: "Chapter II · Spice",
    title: "Pomegranate, sumac, rose",
    body: "Bright, sour, deep. Every plate is layered like an Armenian rug — color upon color, slowly.",
  },
  {
    img: grill,
    eyebrow: "Chapter III · Fire",
    title: "Slow over the embers",
    body: "Lamb shish, kebab orfali, kibbeh nayyeh — finished above red coals until the smoke writes its own signature.",
  },
  {
    img: baklava,
    eyebrow: "Chapter IV · Sweet",
    title: "Pistachio, honey, gold leaf",
    body: "End the evening with a glass of arak, a small cup of cardamom coffee and baklava that crackles like parchment.",
  },
];

/**
 * StoryStrip — a horizontal pinned scroll-strip between Hero and About that
 * tells the Mayrig heritage story in 4 chapters. Drag, scroll-snap or use
 * arrow keys. Each chapter card has a gold-foil reveal on entry.
 */
export const StoryStrip = () => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-chapter]"));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-chapter"));
            setActive(idx);
            entry.target.classList.add("is-revealed");
          }
        });
      },
      { root: el, threshold: 0.6 },
    );
    cards.forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-chapter="${i}"]`);
    card?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <section
      id="story"
      aria-label="Mayrig heritage story"
      className="relative py-20 sm:py-28 bg-gradient-to-b from-background via-surface/40 to-background overflow-hidden"
    >
      <div className="container-narrow">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="max-w-xl">
            <span className="eyebrow"><span className="gold-divider" /> The story</span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">A century in four chapters</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {CHAPTERS.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                aria-label={`Go to chapter ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  active === i ? "w-10 bg-primary" : "w-4 bg-border hover:bg-primary/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className="mt-10 flex gap-5 sm:gap-7 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-5 sm:px-8 pb-6"
      >
        {CHAPTERS.map((c, i) => (
          <article
            key={c.title}
            data-chapter={i}
            className="story-card group snap-start shrink-0 w-[80vw] sm:w-[420px] md:w-[480px] aspect-[3/4] relative rounded-2xl overflow-hidden border border-border shadow-elev"
          >
            <img
              src={c.img}
              alt={c.title}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover scale-105 group-hover:scale-100 transition-transform duration-[1200ms] ease-out"
            />
            {/* Foil reveal overlay */}
            <span aria-hidden className="story-foil pointer-events-none absolute inset-0" />
            {/* Bottom gradient + copy */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 bg-gradient-to-t from-background via-background/80 to-transparent">
              <span className="eyebrow text-primary"><span className="gold-divider" /> {c.eyebrow}</span>
              <h3 className="mt-2 font-display text-2xl sm:text-3xl gold-text">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">{c.body}</p>
            </div>
          </article>
        ))}
        {/* Spacer so last card can fully snap */}
        <div className="shrink-0 w-4 sm:w-8" aria-hidden />
      </div>
    </section>
  );
};
