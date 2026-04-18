import { useMemo, useState } from "react";
import { ALL_TIMES, todayISO, formatDateLong, getSlotsForDate } from "@/lib/reservations";

/**
 * QuickReserve — compact inline card placed directly inside the Hero so guests
 * can pick a date / party / time and jump straight into the reservation flow
 * without scrolling. Selections are cached in sessionStorage and consumed by
 * the main ReservationWidget on landing.
 */
export const QuickReserve = () => {
  const [date, setDate] = useState<string>(todayISO());
  const [party, setParty] = useState(2);
  const dates = useMemo(() => {
    const out: { iso: string; weekday: string; day: number }[] = [];
    const base = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      out.push({
        iso: d.toISOString().slice(0, 10),
        weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
        day: d.getDate(),
      });
    }
    return out;
  }, []);

  const slots = useMemo(() => getSlotsForDate(date, party), [date, party]);
  const suggested = slots.filter((s) => s.status !== "full").slice(0, 4);

  const goToReserve = (time?: string) => {
    sessionStorage.setItem(
      "mayrig.quick-reserve",
      JSON.stringify({ date, party, time: time ?? null }),
    );
    document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="glass-card overflow-hidden text-left">
      <div className="px-5 sm:px-6 py-4 border-b border-border/60 flex items-baseline justify-between gap-3">
        <span className="eyebrow"><span className="gold-divider" /> Reserve in seconds</span>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {formatDateLong(date)}
        </span>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        {/* Date strip */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
          {dates.map((d, i) => {
            const active = d.iso === date;
            return (
              <button
                key={d.iso}
                onClick={() => setDate(d.iso)}
                className={`shrink-0 w-12 sm:w-14 rounded-lg border py-2 text-center transition-colors ${
                  active
                    ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                    : "border-border bg-secondary/40 hover:border-primary/40"
                }`}
              >
                <div className="text-[9px] uppercase tracking-widest opacity-80">{d.weekday}</div>
                <div className="text-base font-display leading-none mt-1">{d.day}</div>
                {i === 0 && (
                  <div className={`mt-1 text-[8px] uppercase tracking-widest ${active ? "" : "text-primary"}`}>Today</div>
                )}
              </button>
            );
          })}
        </div>

        {/* Party */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary/90">Guests</span>
            <span className="text-xs text-muted-foreground">
              {party} {party === 1 ? "guest" : "guests"}
            </span>
          </div>
          <div className="grid grid-cols-8 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
              const active = n === party;
              return (
                <button
                  key={n}
                  onClick={() => setParty(n)}
                  className={`h-9 rounded-md border text-xs transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border bg-secondary/40 hover:border-primary/40"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suggested times */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-primary/90">Tonight's openings</span>
            <span className="text-[10px] text-muted-foreground">{suggested.length} of {ALL_TIMES.length}</span>
          </div>
          {suggested.length === 0 ? (
            <button
              onClick={() => goToReserve()}
              className="w-full rounded-xl border border-border bg-secondary/40 py-3 text-sm hover:border-primary/40 transition-colors"
            >
              Fully booked — join the waitlist →
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {suggested.map((s) => (
                <button
                  key={s.time}
                  onClick={() => goToReserve(s.time)}
                  className="relative h-11 rounded-lg border border-border bg-secondary/40 text-sm hover:border-primary/60 hover:bg-primary/10 transition-colors"
                >
                  {s.time}
                  {s.popular && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] uppercase tracking-widest bg-primary text-primary-foreground px-1 py-0.5 rounded-full">
                      ★
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => goToReserve()}
          className="w-full rounded-full bg-gradient-gold text-primary-foreground py-3.5 text-xs uppercase tracking-[0.25em] font-medium shadow-gold hover:opacity-95 transition-opacity"
        >
          Reserve a table →
        </button>
      </div>
    </div>
  );
};
