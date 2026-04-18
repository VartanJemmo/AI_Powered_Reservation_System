export const Visit = () => (
  <section id="visit" className="py-24 sm:py-32 bg-surface/40">
    <div className="container-narrow grid md:grid-cols-2 gap-10 items-center">
      <div>
        <span className="eyebrow"><span className="gold-divider" /> Visit</span>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">Find us</h2>
        <p className="mt-4 text-muted-foreground">
          Tucked along Pasteur Street, in the heart of Gemmayze.
        </p>
        <dl className="mt-8 space-y-5 text-sm">
          <div>
            <dt className="uppercase tracking-widest text-xs text-primary/90">Address</dt>
            <dd className="mt-1 text-foreground/90">Pasteur Street, Gemmayze · Beirut, Lebanon</dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest text-xs text-primary/90">Hours</dt>
            <dd className="mt-1 text-foreground/90">
              Tue – Sun · 18:00 – 23:00<br />Closed Mondays
            </dd>
          </div>
          <div>
            <dt className="uppercase tracking-widest text-xs text-primary/90">Contact</dt>
            <dd className="mt-1 text-foreground/90">
              <a href="tel:+9611000000" className="hover:text-primary">+961 1 000 000</a><br />
              <a href="mailto:hello@mayrig.example" className="hover:text-primary">hello@mayrig.example</a>
            </dd>
          </div>
        </dl>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-elev aspect-[4/3]">
        <iframe
          title="Mayrig location map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=35.5180%2C33.8930%2C35.5260%2C33.8980&layer=mapnik&marker=33.8955%2C35.5220"
          className="absolute inset-0 h-full w-full grayscale contrast-110"
          loading="lazy"
        />
      </div>
    </div>
  </section>
);
