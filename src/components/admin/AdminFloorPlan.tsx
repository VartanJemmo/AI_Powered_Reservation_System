import { useMemo, useState } from "react";
import { PICKER_TABLES } from "@/components/TablePicker";
import { ALL_TIMES, SEATING_LABELS, type Reservation } from "@/lib/reservations";

type Props = {
  date: string;
  reservations: Reservation[];
};

const TYPE_LABEL = { round: "Round", rect: "Banquet", bar: "Bar" } as const;

export const AdminFloorPlan = ({ date, reservations }: Props) => {
  const dayRes = useMemo(
    () => reservations.filter((r) => r.date === date && r.status !== "no-show"),
    [reservations, date],
  );

  // All times that have at least one reservation, plus first time as default
  const times = useMemo(() => {
    const set = new Set(dayRes.map((r) => r.time));
    return ALL_TIMES.filter((t) => set.has(t));
  }, [dayRes]);

  const [time, setTime] = useState<string>(times[0] ?? ALL_TIMES[0]);

  // Reservations grouped by tableId for current time
  const slotRes = useMemo(
    () => dayRes.filter((r) => r.time === time),
    [dayRes, time],
  );
  const byTable = useMemo(() => {
    const map = new Map<string, Reservation>();
    for (const r of slotRes) if (r.tableId) map.set(r.tableId, r);
    return map;
  }, [slotRes]);

  const unassigned = slotRes.filter((r) => !r.tableId);
  const totalCovers = slotRes.reduce((s, r) => s + r.partySize, 0);

  return (
    <div className="mt-12">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl">Floor plan</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Tables with their guest, party size and seating for the selected slot.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{slotRes.length} bookings · {totalCovers} covers</span>
        </div>
      </div>

      {/* Time chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {(times.length ? times : ALL_TIMES.slice(0, 6)).map((t) => {
          const active = t === time;
          const count = dayRes.filter((r) => r.time === t).length;
          return (
            <button
              key={t}
              onClick={() => setTime(t)}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {t}
              {count > 0 && <span className="ml-1.5 opacity-80">· {count}</span>}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 text-[10px] uppercase tracking-widest">
        <Dot color="bg-emerald-500/20 border border-emerald-500/60" label="Free" />
        <Dot color="bg-primary border border-primary" label="Reserved" />
        <Dot color="bg-amber-500/20 border border-amber-500/60" label="Outdoor" />
      </div>

      {/* Map */}
      <div className="mt-4 relative rounded-2xl border border-border bg-gradient-to-br from-surface/70 to-background p-4 overflow-hidden">
        <div className="absolute top-2 left-3 text-[9px] uppercase tracking-widest text-muted-foreground/60">Lounge</div>
        <div className="absolute top-2 right-3 text-[9px] uppercase tracking-widest text-muted-foreground/60">Bar</div>
        <div className="relative w-full" style={{ aspectRatio: "12 / 8" }} aria-label="Restaurant floor plan">
          <div className="absolute top-0 bottom-0 right-[6%] w-[3px] bg-primary/30 rounded-full" aria-hidden />
          {PICKER_TABLES.map((t) => {
            const res = byTable.get(t.id);
            const reserved = !!res;
            const outdoor = res?.seating === "outdoor-smoking";

            const sizeClass =
              t.type === "round"
                ? "w-14 h-14 sm:w-16 sm:h-16 rounded-full"
                : t.type === "rect"
                ? "w-14 h-20 sm:w-16 sm:h-24 rounded-lg"
                : "w-12 h-12 sm:w-14 sm:h-14 rounded-md";

            const stateClass = reserved
              ? outdoor
                ? "bg-amber-500/25 border-amber-500 text-amber-100 shadow-gold"
                : "bg-primary/90 border-primary text-primary-foreground shadow-gold"
              : "bg-emerald-500/10 border-emerald-500/50 text-emerald-200";

            return (
              <div
                key={t.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 border-2 transition-all flex flex-col items-center justify-center text-[10px] font-display group ${sizeClass} ${stateClass}`}
                style={{ left: `${(t.x / 12) * 100}%`, top: `${(t.y / 8) * 100}%` }}
                title={
                  res
                    ? `${t.id} · ${res.name} · party ${res.partySize} · ${res.time} · ${SEATING_LABELS[res.seating]}`
                    : `${t.id} · ${TYPE_LABEL[t.type]} · ${t.seats} seats · free`
                }
              >
                <span className="leading-none font-semibold">{t.id}</span>
                {res ? (
                  <>
                    <span className="text-[9px] mt-0.5 truncate max-w-[80%] font-sans">
                      {res.name.split(" ")[0]}
                    </span>
                    <span className="text-[9px] opacity-90 font-sans">
                      {res.partySize}p · {res.time}
                    </span>
                  </>
                ) : (
                  <span className="text-[9px] opacity-70 mt-0.5 font-sans">{t.seats}p</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reservations details list */}
      <div className="mt-5 grid md:grid-cols-2 gap-3">
        {slotRes.length === 0 && (
          <div className="md:col-span-2 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No reservations at {time}.
          </div>
        )}
        {slotRes.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card/60 p-4 flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/15 border border-primary/30 grid place-items-center font-display text-primary text-sm shrink-0">
              {r.tableId ?? "—"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-medium truncate">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.time} · {r.partySize}p</div>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {r.phone}{r.email ? ` · ${r.email}` : ""}
              </div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-widest ${
                    r.seating === "outdoor-smoking"
                      ? "border-amber-500/40 text-amber-400 bg-amber-500/10"
                      : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                  }`}
                >
                  {r.seating === "outdoor-smoking" ? "🌿 Outdoor" : "🏠 Indoor"}
                </span>
                <span className="inline-flex items-center rounded-full border border-border bg-secondary/60 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {r.status}
                </span>
                {!r.tableId && (
                  <span className="inline-flex items-center rounded-full border border-dashed border-border px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                    No table picked
                  </span>
                )}
              </div>
              {r.notes && <div className="text-xs text-muted-foreground mt-1.5 italic">"{r.notes}"</div>}
            </div>
          </div>
        ))}
      </div>

      {unassigned.length > 0 && (
        <p className="text-[11px] text-muted-foreground mt-3">
          {unassigned.length} booking{unassigned.length === 1 ? "" : "s"} at this slot have no table assigned — restaurant will pick one.
        </p>
      )}
    </div>
  );
};

const Dot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
    {label}
  </span>
);
