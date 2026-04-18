import g1 from "@/assets/interior-1.jpg";
import g2 from "@/assets/dish-1.jpg";
import g3 from "@/assets/dish-2.jpg";
import g4 from "@/assets/interior-2.jpg";
import g5 from "@/assets/dish-3.jpg";
import g6 from "@/assets/hero.jpg";

const tiles = [g1, g2, g3, g4, g5, g6];

export const Gallery = () => (
  <section id="gallery" className="py-24 sm:py-32">
    <div className="container-narrow">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <span className="eyebrow"><span className="gold-divider" /> Gallery</span>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">Inside Mayrig</h2>
        </div>
        <p className="text-muted-foreground max-w-sm">
          Warm candlelight, dark wood, and plates that tell a story.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {tiles.map((src, i) => (
          <div
            key={i}
            className={`relative overflow-hidden rounded-xl border border-border ${
              i === 0 ? "col-span-2 row-span-2 aspect-square" : "aspect-square"
            }`}
          >
            <img
              src={src}
              alt={`Mayrig interior or dish ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
            />
          </div>
        ))}
      </div>
    </div>
  </section>
);
