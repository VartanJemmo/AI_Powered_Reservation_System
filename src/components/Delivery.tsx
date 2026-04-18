import { Bike, Clock, MapPin, Phone } from "lucide-react";

const PARTNERS = [
  { name: "Toters", url: "https://toters.com" },
  { name: "Talabat", url: "https://talabat.com" },
  { name: "OnlineLB", url: "https://onlinelb.com" },
];

export const Delivery = () => (
  <section id="delivery" className="py-24 sm:py-32 scroll-mt-24">
    <div className="container-narrow">
      <div className="text-center max-w-2xl mx-auto">
        <span className="eyebrow justify-center">
          <span className="gold-divider" /> Delivery <span className="gold-divider" />
        </span>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">Mayrig at home</h2>
        <p className="mt-3 text-muted-foreground">
          Our heritage mezze, slow-grilled kebabs and pistachio sweets — packed
          with care and delivered warm to your door.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-5">
        <Feature
          icon={<Clock className="h-5 w-5" />}
          title="Daily 12:00 PM – 12:00 AM"
          body="Last delivery orders 30 minutes before closing."
        />
        <Feature
          icon={<MapPin className="h-5 w-5" />}
          title="Across Beirut"
          body="Gemmayze, Achrafieh, Hamra, Mar Mikhael & beyond."
        />
        <Feature
          icon={<Bike className="h-5 w-5" />}
          title="30 – 60 min"
          body="Free delivery on orders above $35. $3 flat fee otherwise."
        />
      </div>

      <div className="mt-10 glass-card p-6 sm:p-8 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl">Order direct</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Fastest, freshest, no middleman fees.
            </p>
          </div>
          <a
            href="tel:+9611000000"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-gold text-primary-foreground px-6 py-3 text-sm uppercase tracking-widest font-medium shadow-gold whitespace-nowrap"
          >
            <Phone className="h-4 w-4" /> +961 1 000 000
          </a>
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs uppercase tracking-widest text-primary/90 mb-3">
            Or order through our partners
          </p>
          <div className="flex flex-wrap gap-3">
            {PARTNERS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border px-5 py-2.5 text-sm hover:border-primary/40 hover:text-primary transition-colors"
              >
                {p.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Feature = ({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) => (
  <div className="rounded-2xl border border-border bg-secondary/30 p-6">
    <div className="h-10 w-10 rounded-full bg-gradient-gold text-primary-foreground grid place-items-center shadow-gold">
      {icon}
    </div>
    <h3 className="mt-4 font-display text-xl">{title}</h3>
    <p className="mt-1 text-sm text-muted-foreground">{body}</p>
  </div>
);
