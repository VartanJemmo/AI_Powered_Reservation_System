import interior from "@/assets/interior-2.jpg";
import g1 from "@/assets/interior-1.jpg";
import g2 from "@/assets/dish-1.jpg";
import g3 from "@/assets/dish-2.jpg";
import g4 from "@/assets/interior-2.jpg";
import g5 from "@/assets/dish-3.jpg";
import g6 from "@/assets/hero.jpg";

const tiles = [g1, g2, g3, g4, g5, g6];

export const About = () => (
  <section id="about" className="relative py-24 sm:py-32">
    <div className="container-narrow grid md:grid-cols-2 gap-12 md:gap-20 items-center">
      <div>
        <span className="eyebrow"><span className="gold-divider" /> Our Story</span>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl leading-tight">
          Recipes carried <em className="gold-text not-italic">through generations</em>.
        </h2>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          Mayrig — meaning "mother" in Armenian — was born from a desire to honor the women who
          kept our cuisine alive across borders and centuries. Every plate is a memory: hand-rolled
          manti, slow-simmered harissa, lamb kebabs kissed by ember.
        </p>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          We invite you to a table where heritage is the main course.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-6">
          {[
            { k: "20+", v: "Years of family recipes" },
            { k: "100%", v: "House-made daily" },
            { k: "4.9★", v: "Guest rating" },
          ].map((s) => (
            <div key={s.k}>
              <div className="font-display text-3xl gold-text">{s.k}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-radial-gold blur-2xl opacity-60" aria-hidden />
        <img
          src={interior}
          alt="Chef plating an Armenian dish at Mayrig"
          loading="lazy"
          width={1024}
          height={1280}
          className="relative rounded-2xl border border-border shadow-elev w-full object-cover aspect-[4/5]"
        />
      </div>
    </div>

    {/* Gallery merged into About */}
    <div id="gallery" className="container-narrow mt-24 sm:mt-32">
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
