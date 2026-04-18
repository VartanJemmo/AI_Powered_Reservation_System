import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import {
  ALL_TIMES,
  deleteReservation,
  formatDateLong,
  loadReservations,
  refreshReservations,
  SEATING_LABELS,
  subscribeReservations,
  updateReservation,
  type Reservation,
} from "@/lib/reservations";

const MyReservations = () => {
  const { user } = useAuth();
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [list, setList] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    document.title = "My reservations · Mayrig";
    let unsub = () => {};
    (async () => {
      await refreshReservations();
      setLoading(false);
      unsub = subscribeReservations(() => {
        // Re-filter when cache changes
        if (searched || user) recompute();
      });
      if (user) {
        setSearched(true);
        recompute();
      }
    })();
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalize = (s: string) => s.replace(/[^\d+a-z@.]/gi, "").toLowerCase();

  const recompute = () => {
    const ph = normalize(phone);
    const em = normalize(email);
    const all = loadReservations();
    const matches = all.filter((r) => {
      const rp = normalize(r.phone || "");
      const re = normalize(r.email || "");
      return (ph && rp && rp.endsWith(ph.slice(-7))) || (em && re && re === em);
    });
    matches.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    setList(matches);
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() && !email.trim()) {
      toast.error("Enter your phone or email to find your reservations.");
      return;
    }
    setSearched(true);
    recompute();
  };

  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return list.filter((r) => r.date >= today);
  }, [list]);
  const past = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return list.filter((r) => r.date < today);
  }, [list]);

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-50 pointer-events-none" aria-hidden />
      <header className="container-narrow pt-8 flex items-center justify-between">
        <Link to="/"><Logo /></Link>
        <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </header>

      <section className="container-narrow relative pt-10 pb-20 max-w-3xl">
        <div className="text-center">
          <span className="eyebrow justify-center">
            <span className="gold-divider" /> Your bookings <span className="gold-divider" />
          </span>
          <h1 className="mt-3 font-display text-4xl sm:text-5xl">My reservations</h1>
          <p className="mt-3 text-muted-foreground">
            View, edit or cancel any of your upcoming visits.
          </p>
        </div>

        <form onSubmit={onSearch} className="mt-8 glass-card p-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 03 123 456"
              className="w-full bg-secondary/60 border border-border rounded-md px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Email">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              className="w-full bg-secondary/60 border border-border rounded-md px-3 py-2 text-sm"
            />
          </Field>
          <button
            type="submit"
            className="rounded-full bg-gradient-gold text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-widest font-medium shadow-gold"
          >
            Find
          </button>
        </form>

        <div className="mt-8 space-y-8">
          {loading ? (
            <p className="text-center text-muted-foreground">Loading…</p>
          ) : !searched ? (
            <p className="text-center text-muted-foreground text-sm">
              Enter your phone or email above to see your reservations.
            </p>
          ) : list.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <p className="text-muted-foreground">No reservations found for those details.</p>
              <Link to="/#reserve" className="mt-4 inline-block text-primary text-sm hover:underline">
                Book a new table →
              </Link>
            </div>
          ) : (
            <>
              <Group title={`Upcoming (${upcoming.length})`} items={upcoming} empty="No upcoming visits." />
              {past.length > 0 && (
                <Group title={`Past (${past.length})`} items={past} empty="" readOnly />
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block text-left">
    <div className="text-[10px] uppercase tracking-widest text-primary/90 mb-1">{label}</div>
    {children}
  </label>
);

const Group = ({
  title,
  items,
  empty,
  readOnly,
}: {
  title: string;
  items: Reservation[];
  empty: string;
  readOnly?: boolean;
}) => (
  <div>
    <h2 className="font-display text-2xl mb-4">{title}</h2>
    {items.length === 0 ? (
      <p className="text-sm text-muted-foreground">{empty}</p>
    ) : (
      <div className="space-y-4">
        {items.map((r) => (
          <ReservationCard key={r.id} r={r} readOnly={readOnly} />
        ))}
      </div>
    )}
  </div>
);

const ReservationCard = ({ r, readOnly }: { r: Reservation; readOnly?: boolean }) => {
  const [editing, setEditing] = useState(false);
  const [party, setParty] = useState(r.partySize);
  const [time, setTime] = useState(r.time);
  const [notes, setNotes] = useState(r.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const reset = () => {
    setParty(r.partySize);
    setTime(r.time);
    setNotes(r.notes ?? "");
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateReservation(r.id, { partySize: party, time, notes });
      toast.success("Reservation updated.");
      setEditing(false);
    } catch (e) {
      console.error(e);
      toast.error("Could not update. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = async () => {
    if (!confirm("Cancel this reservation? This cannot be undone.")) return;
    setCancelling(true);
    try {
      await deleteReservation(r.id);
      toast.success("Reservation cancelled.");
    } catch (e) {
      console.error(e);
      toast.error("Could not cancel. Please call us.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="glass-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-primary/90">
            {formatDateLong(r.date)}
          </div>
          <div className="font-display text-2xl mt-0.5">
            {r.time} · {r.partySize} {r.partySize === 1 ? "guest" : "guests"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {SEATING_LABELS[r.seating]} · Ref {r.id.slice(0, 8).toUpperCase()}
          </div>
        </div>
        {!readOnly && !editing && (
          <div className="flex gap-2">
            <button
              onClick={() => { reset(); setEditing(true); }}
              className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/40"
            >
              Edit
            </button>
            <button
              onClick={cancel}
              disabled={cancelling}
              className="rounded-full border border-destructive/40 text-destructive px-3 py-1.5 text-xs hover:bg-destructive/10 disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </button>
            <Link
              to={`/confirmation/${r.id}`}
              className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary/40"
            >
              View
            </Link>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <Field label="Guests">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5">
              <button
                type="button"
                onClick={() => setParty((p) => Math.max(1, p - 1))}
                className="h-6 w-6 grid place-items-center rounded-full hover:bg-background"
              >−</button>
              <span className="min-w-[2ch] text-center font-medium">{party}</span>
              <button
                type="button"
                onClick={() => setParty((p) => Math.min(20, p + 1))}
                className="h-6 w-6 grid place-items-center rounded-full hover:bg-background"
              >+</button>
            </div>
          </Field>
          <Field label="Time">
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-secondary/60 border border-border rounded-md px-3 py-2 text-sm"
            >
              {ALL_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Allergies, occasion, requests…"
                className="w-full bg-secondary/60 border border-border rounded-md px-3 py-2 text-sm"
              />
            </Field>
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <button
              onClick={() => { setEditing(false); reset(); }}
              disabled={saving}
              className="rounded-full border border-border px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-gradient-gold text-primary-foreground px-5 py-2 text-xs uppercase tracking-widest font-medium shadow-gold disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservations;
