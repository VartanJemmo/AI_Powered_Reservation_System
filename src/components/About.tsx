import interior from "@/assets/interior-2.jpg";

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
  </section>
);
