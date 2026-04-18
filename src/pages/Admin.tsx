import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  formatDateLong, getSlotsForDate, loadReservations,
  SLOT_CAPACITY_VALUE, todayISO, updateReservationStatus, type Reservation,
} from "@/lib/reservations";
import { Logo } from "@/components/Logo";

type Filter = "all" | "confirmed" | "seated" | "no-show" | "waitlist";

function buildDateStrip(days = 14) {
  const out: { iso: string; weekday: string; day: number; month: string }[] = [];
  const base = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    out.push({
      iso: d.toISOString().slice(0, 10),
      weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
      day: d.getDate(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return out;
}

const Admin = () => {
  const [date, setDate] = useState(todayISO());
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => { document.title = "Admin · Mayrig"; }, []);

  const dayList = useMemo(
    () =>
      loadReservations()
        .filter((r) => r.date === date)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [date, tick]
  );

  // Counts per day for sidebar strip
  const dateStrip = useMemo(() => buildDateStrip(14), []);
  const allReservations = useMemo(() => loadReservations(), [tick]);
  const countByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of allReservations) map.set(r.date, (map.get(r.date) ?? 0) + 1);
    return map;
  }, [allReservations]);

  const filtered = useMemo(() => {
    return dayList.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !r.name.toLowerCase().includes(q) &&
          !r.phone.toLowerCase().includes(q) &&
          !(r.email ?? "").toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [dayList, filter, query]);

  const slots = useMemo(() => getSlotsForDate(date, 1), [date, tick]);

  const totals = useMemo(() => {
    const covers = dayList.filter((r) => r.status !== "no-show").reduce((s, r) => s + r.partySize, 0);
    const noShow = dayList.filter((r) => r.status === "no-show").length;
    const seated = dayList.filter((r) => r.status === "seated").length;
    const wait = dayList.filter((r) => r.status === "waitlist").length;
    const utilization = Math.min(
      100,
      Math.round((covers / (SLOT_CAPACITY_VALUE * slots.length)) * 100)
    );
    return { covers, count: dayList.length, noShow, seated, wait, utilization };
  }, [dayList, slots.length]);

  const setStatus = (id: string, s: Reservation["status"]) => {
    updateReservationStatus(id, s);
    setTick((t) => t + 1);
  };

  const peakSlot = slots.reduce((a, b) => (b.bookedCovers > a.bookedCovers ? b : a), slots[0]);

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/60 sticky top-0 z-30 bg-background/80 backdrop-blur-md">
        <div className="container-wide flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline text-xs uppercase tracking-widest text-muted-foreground">/ Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 rounded-lg border border-border bg-input/60 px-3 text-sm"
            />
          </div>
        </div>
      </header>

      <div className="container-wide py-8 grid lg:grid-cols-[280px_1fr] gap-8">
        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div>
            <h2 className="font-display text-xl">Pick a day</h2>
            <p className="text-xs text-muted-foreground mt-1">Next 14 days</p>
            <div className="mt-4 grid grid-cols-7 lg:grid-cols-4 gap-2">
              {dateStrip.map((d, i) => {
                const active = d.iso === date;
                const count = countByDate.get(d.iso) ?? 0;
                return (
                  <button
                    key={d.iso}
                    onClick={() => setDate(d.iso)}
                    className={`relative rounded-xl border px-1 py-2 text-center transition-all ${
                      active
                        ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                        : "border-border bg-secondary/40 hover:border-primary/40"
                    }`}
                  >
                    <div className="text-[9px] uppercase tracking-widest opacity-80">{d.weekday}</div>
                    <div className="font-display text-lg leading-none mt-1">{d.day}</div>
                    <div className="text-[9px] uppercase tracking-widest opacity-80 mt-0.5">{d.month}</div>
                    {count > 0 && (
                      <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-medium grid place-items-center ${
                        active ? "bg-background text-primary" : "bg-primary text-primary-foreground"
                      }`}>
                        {count}
                      </span>
                    )}
                    {i === 0 && !active && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-widest text-primary">Today</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Filter status</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["all", "confirmed", "seated", "no-show", "waitlist"] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Capacity</h3>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-display text-3xl gold-text">{totals.utilization}%</span>
              <span className="text-xs text-muted-foreground">{totals.covers} / {SLOT_CAPACITY_VALUE * slots.length} covers</span>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-gold transition-all" style={{ width: `${totals.utilization}%` }} />
            </div>
            {peakSlot && peakSlot.bookedCovers > 0 && (
              <p className="text-xs text-muted-foreground mt-3">
                Peak: <span className="text-foreground">{peakSlot.time}</span> · {peakSlot.bookedCovers} covers
              </p>
            )}
          </div>
        </aside>

        {/* Main */}
        <section>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl">Reservations</h1>
              <p className="text-muted-foreground text-sm mt-1">{formatDateLong(date)}</p>
            </div>
            <div className="relative w-full sm:w-72">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, phone, email…"
                className="h-11 w-full rounded-xl border border-border bg-input/60 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat k="Bookings" v={String(totals.count)} />
            <Stat k="Covers" v={String(totals.covers)} />
            <Stat k="Seated" v={String(totals.seated)} />
            <Stat k="No-shows" v={String(totals.noShow)} accent={totals.noShow > 0 ? "destructive" : undefined} />
          </div>

          <h2 className="mt-10 font-display text-xl">Slots overview</h2>
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
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

          <div className="mt-10 flex items-end justify-between gap-4">
            <h2 className="font-display text-xl">
              Bookings <span className="text-muted-foreground text-sm font-sans ml-2">({filtered.length})</span>
            </h2>
          </div>

          <div className="mt-4 rounded-2xl border border-border overflow-hidden">
            <div className="hidden lg:grid grid-cols-[80px_1.4fr_70px_160px_180px_120px_220px] bg-secondary/60 px-5 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <div>Time</div>
              <div>Guest</div>
              <div>Party</div>
              <div>Phone</div>
              <div>Email</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>

            {filtered.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                {dayList.length === 0 ? "No bookings for this date." : "No bookings match your filters."}
              </div>
            )}

            {filtered.map((r) => (
              <div
                key={r.id}
                className="grid lg:grid-cols-[80px_1.4fr_70px_160px_180px_120px_220px] gap-3 px-4 lg:px-5 py-4 border-t border-border items-center text-sm hover:bg-secondary/30 transition-colors"
              >
                <div className="font-medium font-display text-lg lg:text-base">{r.time}</div>
                <div>
                  <div className="font-medium">{r.name}</div>
                  {r.notes && <div className="text-xs text-muted-foreground mt-0.5 italic">"{r.notes}"</div>}
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary border border-border px-2 py-0.5 text-xs">
                    👥 {r.partySize}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs lg:text-sm">{r.phone}</div>
                <div className="text-muted-foreground text-xs lg:text-sm truncate">{r.email ?? "—"}</div>
                <div><StatusPill status={r.status} /></div>
                <div className="flex lg:justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => setStatus(r.id, r.status === "seated" ? "confirmed" : "seated")}
                    className="text-xs rounded-full border border-border px-3 py-1.5 hover:border-primary/40 transition-colors"
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
      </div>
    </main>
  );
};

const Stat = ({ k, v, accent }: { k: string; v: string; accent?: "destructive" }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <div className="text-xs uppercase tracking-widest text-muted-foreground">{k}</div>
    <div className={`font-display text-3xl mt-1 ${accent === "destructive" ? "text-destructive" : "gold-text"}`}>{v}</div>
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
