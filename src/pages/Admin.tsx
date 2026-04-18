import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchReminderLog,
  formatDateLong, getSlotsForDate, loadReservations,
  refreshReservations, SEATING_LABELS, subscribeReservations,
  SLOT_CAPACITY_VALUE, todayISO, triggerRemindersNow, updateReservationStatus,
  type ReminderLogEntry, type Reservation,
} from "@/lib/reservations";
import { getAllOrders, formatPrice, type GuestOrder } from "@/lib/orders";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FeedbackPanel } from "@/components/admin/FeedbackPanel";
import { AdminFloorPlan } from "@/components/admin/AdminFloorPlan";

type Tab = "reservations" | "feedback";

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
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [date, setDate] = useState(todayISO());
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("reservations");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    document.title = "Admin · Mayrig";
    refreshReservations();
    const unsub = subscribeReservations(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, []);

  const setStatusAsync = async (id: string, s: Reservation["status"]) => {
    await updateReservationStatus(id, s);
    setTick((t) => t + 1);
  };

  const sendCancellationEmail = (
    r: Reservation,
    reason: "no-show" | "cancelled",
  ) => {
    if (!r.email) return;
    supabase.functions
      .invoke("send-transactional-email", {
        body: {
          templateName: "reservation-cancellation",
          recipientEmail: r.email,
          idempotencyKey: `reservation-cancel-${reason}-${r.id}`,
          templateData: {
            name: r.name,
            date: r.date,
            time: r.time,
            partySize: r.partySize,
            reason,
          },
        },
      })
      .then(({ error }) => {
        if (error) {
          console.error("cancellation email failed:", error);
          toast.error("Status updated, but email failed to send.");
        } else {
          toast.success(
            reason === "no-show"
              ? "Marked as no-show — email sent to guest."
              : "Reservation cancelled — email sent to guest.",
          );
        }
      });
  };

  const handleNoShow = async (r: Reservation) => {
    const wasNoShow = r.status === "no-show";
    await setStatusAsync(r.id, wasNoShow ? "confirmed" : "no-show");
    if (!wasNoShow) sendCancellationEmail(r, "no-show");
  };

  const handleCancel = async (r: Reservation) => {
    if (!confirm(`Cancel reservation for ${r.name}? This will email the guest.`)) return;
    await setStatusAsync(r.id, "no-show");
    sendCancellationEmail(r, "cancelled");
  };

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

  const trimmedQuery = query.trim();

  const matchesReservationSearch = (r: Reservation, rawQuery: string) => {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;

    const name = (r.name ?? "").toLowerCase();
    const phone = (r.phone ?? "").toLowerCase();
    const email = (r.email ?? "").toLowerCase();
    const phoneDigits = (r.phone ?? "").replace(/\D/g, "");
    const tokens = q.split(/\s+/).filter(Boolean);

    return tokens.every((tok) => {
      const tokDigits = tok.replace(/\D/g, "");
      return (
        name.includes(tok) ||
        phone.includes(tok) ||
        (email && email.includes(tok)) ||
        (tokDigits.length > 0 && phoneDigits.includes(tokDigits))
      );
    });
  };

  const filtered = useMemo(() => {
    const source = trimmedQuery ? allReservations : dayList;

    return source
      .filter((r) => {
        if (filter !== "all" && r.status !== filter) return false;
        return matchesReservationSearch(r, trimmedQuery);
      })
      .sort((a, b) =>
        a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
      );
  }, [allReservations, dayList, filter, trimmedQuery]);

  const searchSuggestions = useMemo(() => {
    if (!trimmedQuery) return [] as Reservation[];

    const seen = new Set<string>();
    return filtered.filter((r) => {
      const key = `${r.name}__${r.phone}__${r.email ?? ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 6);
  }, [filtered, trimmedQuery]);

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
    setStatusAsync(id, s);
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

          <nav className="flex items-center gap-1 rounded-full border border-border bg-secondary/40 p-1">
            {(["reservations", "feedback"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs uppercase tracking-widest rounded-full px-4 py-1.5 transition-colors ${
                  tab === t
                    ? "bg-gradient-gold text-primary-foreground shadow-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </div>
            {tab === "reservations" && (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-lg border border-border bg-input/60 px-3 text-sm"
              />
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-border bg-secondary/40 px-3 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              aria-label="Sign out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M15 17l5-5-5-5M20 12H9M12 19a7 7 0 1 1 0-14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {tab === "feedback" ? (
        <div className="container-wide py-8">
          <FeedbackPanel />
        </div>
      ) : (
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
            <div className="relative w-full sm:w-80">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search guest by name or phone…"
                aria-autocomplete="list"
                className="h-11 w-full rounded-xl border border-border bg-input/60 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="m20 20-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {trimmedQuery && (
                <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg">
                  {searchSuggestions.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto">
                      {searchSuggestions.map((r) => (
                        <button
                          key={`${r.name}-${r.phone}-${r.email ?? "no-email"}`}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setQuery(r.name);
                          }}
                          className="flex w-full items-start justify-between gap-3 border-t border-border/60 px-4 py-3 text-left transition-colors first:border-t-0 hover:bg-secondary/40"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-foreground">{r.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {r.phone}
                              {r.email ? ` · ${r.email}` : ""}
                            </div>
                          </div>
                          <div className="shrink-0 text-right text-[11px] uppercase tracking-widest text-muted-foreground">
                            <div>{r.time}</div>
                            <div>{r.date}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground">No matching guests.</div>
                  )}
                </div>
              )}
            </div>
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

          <AdminFloorPlan date={date} reservations={dayList} />

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
                {query.trim()
                  ? `No bookings match “${query.trim()}”.`
                  : dayList.length === 0
                  ? "No bookings for this date."
                  : "No bookings match your filters."}
              </div>
            )}

            {filtered.map((r) => (
              <div
                key={r.id}
                className="grid lg:grid-cols-[80px_1.4fr_70px_160px_180px_120px_220px] gap-3 px-4 lg:px-5 py-4 border-t border-border items-center text-sm hover:bg-secondary/30 transition-colors"
              >
                <div className="font-medium font-display text-lg lg:text-base">
                  {r.time}
                  {query.trim() && r.date !== date && (
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans font-normal mt-0.5">
                      {r.date}
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium flex items-center gap-2 flex-wrap">
                    {r.name}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-widest ${
                        r.seating === "outdoor-smoking"
                          ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                          : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                      }`}
                      title={SEATING_LABELS[r.seating]}
                    >
                      {r.seating === "outdoor-smoking" ? "🌿 Outdoor · Smoking" : "🏠 Indoor · Non-smoking"}
                    </span>
                  </div>
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
                    onClick={() => handleNoShow(r)}
                    className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                      r.status === "no-show"
                        ? "bg-destructive/20 border-destructive/40 text-destructive"
                        : "border-border hover:border-destructive/60 hover:text-destructive"
                    }`}
                  >
                    {r.status === "no-show" ? "Restore" : "No-show"}
                  </button>
                  {r.status !== "no-show" && (
                    <button
                      onClick={() => handleCancel(r)}
                      className="text-xs rounded-full border border-border px-3 py-1.5 hover:border-destructive/60 hover:text-destructive transition-colors"
                      title={r.email ? "Cancel and email guest" : "Cancel (no email on file)"}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <RemindersPanel tick={tick} />

          <GuestOrdersPanel tick={tick} />
        </section>
      </div>
      )}
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

const GuestOrdersPanel = ({ tick }: { tick: number }) => {
  const orders = useMemo<GuestOrder[]>(() => getAllOrders(), [tick]);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mt-12">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-xl">
          Guest orders
          <span className="text-muted-foreground text-sm font-sans ml-2">({orders.length})</span>
        </h2>
        <p className="text-xs text-muted-foreground">Saved selections by guest profile</p>
      </div>

      <div className="mt-4 rounded-2xl border border-border overflow-hidden">
        {orders.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No saved orders yet.
          </div>
        )}
        {orders.map((o) => {
          const isOpen = openId === o.id;
          const counts = o.items.reduce(
            (acc, it) => {
              acc[it.category] = (acc[it.category] ?? 0) + it.qty;
              return acc;
            },
            {} as Record<string, number>
          );
          return (
            <div key={o.id} className="border-t border-border first:border-t-0">
              <button
                onClick={() => setOpenId(isOpen ? null : o.id)}
                className="w-full grid grid-cols-[1.4fr_1fr_auto_auto] gap-3 px-4 lg:px-5 py-4 items-center text-sm hover:bg-secondary/30 transition-colors text-left"
              >
                <div>
                  <div className="font-medium">{o.guestName}</div>
                  <div className="text-xs text-muted-foreground">{o.guestEmail}</div>
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                  {(["food", "drinks", "desserts"] as const).map((c) =>
                    counts[c] ? (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full bg-secondary border border-border px-2 py-0.5 capitalize"
                      >
                        {c} · {counts[c]}
                      </span>
                    ) : null
                  )}
                </div>
                <div className="font-display text-lg gold-text">{formatPrice(o.total)}</div>
                <div className="text-xs text-muted-foreground">{isOpen ? "▲" : "▼"}</div>
              </button>
              {isOpen && (
                <div className="px-4 lg:px-5 pb-5 -mt-2">
                  <div className="rounded-xl border border-border bg-secondary/30 divide-y divide-border/60">
                    {o.items.map((it) => (
                      <div
                        key={it.itemId}
                        className="flex items-center justify-between px-4 py-2.5 text-sm"
                      >
                        <div>
                          <div>{it.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {it.category} · {formatPrice(it.price)} × {it.qty}
                          </div>
                        </div>
                        <div className="font-medium">{formatPrice(it.price * it.qty)}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Last updated {new Date(o.updatedAt).toLocaleString()}
                    {o.guestPhone ? ` · ${o.guestPhone}` : ""}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RemindersPanel = ({ tick }: { tick: number }) => {
  const [log, setLog] = useState<ReminderLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const reload = async () => {
    setLoading(true);
    const next = await fetchReminderLog(50);
    setLog(next);
    setLoading(false);
  };

  useEffect(() => { reload(); }, [tick]);

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await triggerRemindersNow();
      toast.success(
        `Reminder check ran — ${res?.processed ?? 0} reminder${res?.processed === 1 ? "" : "s"} processed (dry-run).`,
      );
      await reload();
    } catch (e) {
      console.error(e);
      toast.error("Could not run the reminder job.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mt-12">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl">
            Reminder log
            <span className="text-muted-foreground text-sm font-sans ml-2">({log.length})</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Dry-run mode · runs every 5 min, ~2h before each booking. Add an email domain to enable real sending.
          </p>
        </div>
        <button
          onClick={runNow}
          disabled={running}
          className="text-xs rounded-full border border-primary/40 bg-primary/10 text-primary px-4 py-2 hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
        >
          {running ? "Running…" : "Run reminders now"}
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-border overflow-hidden">
        {loading && log.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">Loading…</div>
        )}
        {!loading && log.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            No reminders yet. Bookings ~2h out will appear here once the cron runs.
          </div>
        )}
        {log.map((entry) => {
          const p = entry.payload ?? {};
          return (
            <div
              key={entry.id}
              className="grid grid-cols-[1fr_auto] gap-3 px-4 lg:px-5 py-3 border-t border-border first:border-t-0 items-center text-sm"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{p.name ?? "Guest"}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.date} · {p.time} · party {p.partySize}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  → {entry.recipient_email ?? "no email"}
                  {entry.error_message ? ` · ${entry.error_message}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ReminderStatusPill status={entry.status} />
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReminderStatusPill = ({ status }: { status: ReminderLogEntry["status"] }) => {
  const map: Record<ReminderLogEntry["status"], string> = {
    "dry-run": "bg-primary/15 text-primary border-primary/30",
    sent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
    skipped: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] uppercase tracking-widest ${map[status]}`}>
      {status}
    </span>
  );
};

export default Admin;


