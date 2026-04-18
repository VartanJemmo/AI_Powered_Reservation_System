import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatDateLong, getReservation, SEATING_LABELS, type Reservation } from "@/lib/reservations";
import { Logo } from "@/components/Logo";

const Confirmation = () => {
  const { id } = useParams();
  const [r, setR] = useState<Reservation | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Reservation confirmed · Mayrig";
    let cancelled = false;
    (async () => {
      if (!id) { setLoading(false); return; }
      const found = await getReservation(id);
      if (!cancelled) {
        setR(found);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">Loading your reservation…</p>
      </main>
    );
  }

  if (!r) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl">Reservation not found</h1>
          <Link to="/" className="mt-4 inline-block text-primary underline-offset-4 hover:underline">Back to home</Link>
        </div>
      </main>
    );
  }

  const isWait = r.status === "waitlist";

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-60 pointer-events-none" aria-hidden />
      <header className="container-narrow pt-8">
        <Link to="/"><Logo /></Link>
      </header>

      <section className="container-narrow relative pt-12 pb-20 max-w-xl">
        <div className="text-center animate-fade-up">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-gold grid place-items-center shadow-gold animate-scale-in">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="hsl(var(--primary-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="eyebrow justify-center mt-6">
            <span className="gold-divider" /> {isWait ? "On the waitlist" : "Confirmed"} <span className="gold-divider" />
          </span>
          <h1 className="mt-4 font-display text-4xl sm:text-5xl">
            {isWait ? "You're on the list" : "Your table is reserved"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {isWait
              ? "We'll text you the moment a table opens up."
              : `We can't wait to welcome you, ${r.name.split(" ")[0]}.`}
          </p>
        </div>

        <div className="mt-10 glass-card p-6 sm:p-8 animate-fade-in">
          <div className="grid grid-cols-2 gap-5 text-sm">
            <Cell k="Date" v={formatDateLong(r.date)} />
            <Cell k="Time" v={isWait ? "Waitlist" : r.time} />
            <Cell k="Party" v={`${r.partySize} ${r.partySize === 1 ? "guest" : "guests"}`} />
            <Cell k="Name" v={r.name} />
            <Cell k="Phone" v={r.phone} />
            {r.email && <Cell k="Email" v={r.email} />}
            <Cell k="Seating" v={SEATING_LABELS[r.seating]} />
            <Cell k="Deposit" v={r.deposit ? "$10/guest held" : "—"} />
            <Cell k="Reference" v={r.id.slice(0, 8).toUpperCase()} />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
            🔔 You'll receive a reminder by SMS the day before. To modify or cancel, reply to that message or call us.
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <a
            href="tel:+9611000000"
            className="rounded-full border border-border py-3 text-sm text-center hover:border-primary/40 transition-colors"
          >
            Call restaurant
          </a>
          <Link
            to="/"
            className="rounded-full bg-gradient-gold text-primary-foreground py-3 text-sm uppercase tracking-widest text-center font-medium shadow-gold"
          >
            Back to home
          </Link>
        </div>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Mayrig · Pasteur Street, Gemmayze, Beirut
        </p>
      </section>
    </main>
  );
};

const Cell = ({ k, v }: { k: string; v: string }) => (
  <div>
    <div className="text-[10px] uppercase tracking-widest text-primary/90">{k}</div>
    <div className="mt-1 text-foreground">{v}</div>
  </div>
);

export default Confirmation;
