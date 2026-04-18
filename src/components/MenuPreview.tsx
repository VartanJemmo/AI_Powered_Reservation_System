import dish1 from "@/assets/dish-1.jpg";
import dish2 from "@/assets/dish-2.jpg";
import dish3 from "@/assets/dish-3.jpg";

const items = [
  { img: dish1, name: "Mezze of the House", desc: "Hummus, muhammara, baba ganoush, lavash", price: "$28" },
  { img: dish2, name: "Lamb Kebab Skewers", desc: "Charcoal-grilled, sumac onion, fresh lavash", price: "$36" },
  { img: dish3, name: "Pistachio Baklava", desc: "Layered phyllo, rosewater syrup, gold leaf", price: "$14" },
];

export const MenuPreview = () => (
  <section id="menu" className="relative py-24 sm:py-32 bg-surface/40">
    <div className="container-narrow">
      <div className="text-center max-w-2xl mx-auto">
        <span className="eyebrow justify-center"><span className="gold-divider" /> The Menu</span>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">A taste of what awaits</h2>
        <p className="mt-4 text-muted-foreground">
          A curated selection from our seasonal menu. Crafted daily by Chef Aline.
        </p>
      </div>
      <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((it, i) => (
          <article
            key={it.name}
            className="group glass-card overflow-hidden hover:border-primary/40 transition-colors"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={it.img}
                alt={it.name}
                loading="lazy"
                width={1024}
                height={1024}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl">{it.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{it.desc}</p>
              </div>
              <span className="text-primary font-medium">{it.price}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
);
