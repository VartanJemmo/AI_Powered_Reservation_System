import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ALL_TIMES, formatDateLong, getSlotsForDate, loadReservations,
  SLOT_CAPACITY_VALUE, todayISO, updateReservationStatus, type Reservation,
} from "@/lib/reservations";
import { Logo } from "@/components/Logo";

const Admin = () => {
  const [date, setDate] = useState(todayISO());
  const [list, setList] = useState<Reservation[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => { document.title = "Admin · Mayrig"; }, []);
  useEffect(() => {
    setList(loadReservations().filter((r) => r.date === date).sort((a, b) => a.time.localeCompare(b.time)));
  }, [date, tick]);

  const slots = useMemo(() => getSlotsForDate(date, 1), [date, tick]);
  const totals = useMemo(() => {
    const covers = list.filter(r => r.status !== "no-show").reduce((s, r) => s + r.partySize, 0);
    const noShow = list.filter(r => r.status === "no-show").length;
    return { covers, count: list.length, noShow };
  }, [list]);

  const setStatus = (id: string, s: Reservation["status"]) => {
    updateReservationStatus(id, s);
    setTick((t) => t + 1);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container-narrow flex items-center justify-between h-16">
          <Link to="/"><Logo /></Link>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Admin</div>
        </div>
      </header>

      <section className="container-narrow py-10">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">Reservations</h1>
            <p className="text-muted-foreground text-sm mt-1">{formatDateLong(date)}</p>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11 rounded-xl border border-border bg-input/60 px-4 text-sm"
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <Stat k="Bookings" v={String(totals.count)} />
          <Stat k="Covers" v={String(totals.covers)} />
          <Stat k="No-shows" v={String(totals.noShow)} />
        </div>

        <h2 className="mt-10 font-display text-xl">Slots overview</h2>
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {slots.map((s) => {
            const pct = Math.min(100, Math.round((s.bookedCovers / SLOT_CAPACITY_VALUE) * 100));
            return (
              <div key={s.time} className="rounded-xl border border-border bg-secondary/40 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.time}</span>
                  <span className={`text-xs ${s.status === "full" ? "text-destructive" : "text-muted-foreground"}`}>
                    {s.bookedCovers}/{SLOT_CAPACITY_VALUE}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-gold" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="mt-10 font-display text-xl">Bookings</h2>
        <div className="mt-4 rounded-2xl border border-border overflow-hidden">
          <div className="hidden sm:grid grid-cols-[80px_1fr_80px_140px_1fr_220px] bg-secondary/60 px-4 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
            <div>Time</div><div>Guest</div><div>Party</div><div>Phone</div><div>Status</div><div className="text-right">Actions</div>
          </div>
          {list.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">No bookings for this date.</div>
          )}
          {list.map((r) => (
            <div key={r.id} className="grid sm:grid-cols-[80px_1fr_80px_140px_1fr_220px] gap-2 px-4 py-4 border-t border-border items-center text-sm">
              <div className="font-medium">{r.time}</div>
              <div>
                <div>{r.name}</div>
                {r.email && <div className="text-xs text-muted-foreground">{r.email}</div>}
              </div>
              <div>{r.partySize}</div>
              <div className="text-muted-foreground">{r.phone}</div>
              <div>
                <StatusPill status={r.status} />
              </div>
              <div className="flex justify-end gap-2 flex-wrap">
                <button
                  onClick={() => setStatus(r.id, r.status === "seated" ? "confirmed" : "seated")}
                  className="text-xs rounded-full border border-border px-3 py-1.5 hover:border-primary/40"
                >
                  {r.status === "seated" ? "Unseat" : "Seat"}
                </button>
                <button
                  onClick={() => setStatus(r.id, r.status === "no-show" ? "confirmed" : "no-show")}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                    r.status === "no-show"
                      ? "bg-destructive/20 border-destructive/40 text-destructive"
                      : "border-border hover:border-destructive/60 hover:text-destructive"
                  }`}
                >
                  {r.status === "no-show" ? "Restore" : "No-show"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <div className="text-xs uppercase tracking-widest text-muted-foreground">{k}</div>
    <div className="font-display text-3xl mt-1 gold-text">{v}</div>
  </div>
);

const StatusPill = ({ status }: { status: Reservation["status"] }) => {
  const map: Record<Reservation["status"], string> = {
    confirmed: "bg-primary/15 text-primary border-primary/30",
    seated: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "no-show": "bg-destructive/15 text-destructive border-destructive/30",
    waitlist: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-widest ${map[status]}`}>
      {status}
    </span>
  );
};

export default Admin;
