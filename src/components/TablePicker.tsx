import { useEffect, useMemo, useState } from "react";
import { getBookedTables, refreshReservations, subscribeReservations } from "@/lib/reservations";

export type PickerTable = {
  id: string;
  type: "round" | "rect" | "bar";
  seats: number;
  // Position on a 12x10 grid (top-down, 1-indexed feel; numbers are arbitrary unit slots)
  x: number;
  y: number;
};

// Mirror of the FloorPlan TABLES, mapped onto a clean 2D grid for the picker.
export const PICKER_TABLES: PickerTable[] = [
  // Round — left side
  { id: "R1", type: "round", seats: 4, x: 1.2, y: 1.2 },
  { id: "R2", type: "round", seats: 4, x: 1.2, y: 3.6 },
  { id: "R3", type: "round", seats: 2, x: 1.2, y: 6.0 },
  { id: "R4", type: "round", seats: 6, x: 3.6, y: 1.2 },
  { id: "R5", type: "round", seats: 4, x: 3.6, y: 6.0 },
  // Banquet — middle
  { id: "T1", type: "rect", seats: 6, x: 6.2, y: 1.2 },
  { id: "T2", type: "rect", seats: 6, x: 6.2, y: 3.6 },
  { id: "T3", type: "rect", seats: 8, x: 6.2, y: 6.0 },
  // Bar — right
  { id: "B1", type: "bar", seats: 2, x: 9.2, y: 1.2 },
  { id: "B2", type: "bar", seats: 2, x: 9.2, y: 2.8 },
  { id: "B3", type: "bar", seats: 2, x: 9.2, y: 4.4 },
  { id: "B4", type: "bar", seats: 2, x: 9.2, y: 6.0 },
];

const TYPE_LABEL: Record<PickerTable["type"], string> = {
  round: "Round",
  rect: "Banquet",
  bar: "Bar",
};

type Props = {
  date: string;
  time: string;
  party: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
};

export const TablePicker = ({ date, time, party, selected, onSelect }: Props) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    refreshReservations();
    const unsub = subscribeReservations(() => setTick((t) => t + 1));
    return () => { unsub(); };
  }, []);

  const bookedSet = useMemo(() => getBookedTables(date, time), [date, time, tick]);

  const fitting = PICKER_TABLES.filter((t) => t.seats >= party && !bookedSet.has(t.id));
  const minFit = fitting.length ? Math.min(...fitting.map((t) => t.seats)) : Infinity;
  const availableCount = fitting.length;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">{availableCount}</span> tables fit your party of {party} · {time}
        </p>
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] uppercase tracking-widest">
        <LegendDot color="bg-emerald-500" label="Available" />
        <LegendDot color="bg-primary" label="Best fit ★" />
        <LegendDot color="bg-primary ring-2 ring-primary/40" label="Selected" />
        <LegendDot color="bg-destructive" label="Booked" />
        <LegendDot color="bg-muted" label="Too small" />
      </div>

      {/* Top-down map */}
      <div className="mt-4 relative rounded-xl border border-border bg-gradient-to-br from-surface/70 to-background p-3 sm:p-4 overflow-hidden">
        {/* Floor labels */}
        <div className="absolute top-2 left-3 text-[9px] uppercase tracking-widest text-muted-foreground/60">Lounge</div>
        <div className="absolute top-2 right-3 text-[9px] uppercase tracking-widest text-muted-foreground/60">Bar</div>

        <div
          className="relative w-full"
          style={{ aspectRatio: "12 / 8" }}
          role="grid"
          aria-label="Restaurant floor plan"
        >
          {/* Bar counter strip */}
          <div className="absolute top-0 bottom-0 right-[6%] w-[3px] bg-primary/30 rounded-full" aria-hidden />

          {PICKER_TABLES.map((t) => {
            const booked = bookedSet.has(t.id);
            const tooSmall = t.seats < party;
            const isSelected = selected === t.id;
            const isBestFit = !booked && !tooSmall && t.seats === minFit;
            const disabled = booked || tooSmall;

            const sizeClass =
              t.type === "round"
                ? "w-12 h-12 sm:w-14 sm:h-14 rounded-full"
                : t.type === "rect"
                ? "w-12 h-16 sm:w-14 sm:h-20 rounded-lg"
                : "w-10 h-10 sm:w-12 sm:h-12 rounded-md";

            const stateClass = isSelected
              ? "bg-primary text-primary-foreground border-primary ring-4 ring-primary/30 shadow-gold scale-110"
              : booked
              ? "bg-destructive/20 text-destructive border-destructive/60 cursor-not-allowed"
              : tooSmall
              ? "bg-muted/30 text-muted-foreground border-muted cursor-not-allowed opacity-60"
              : isBestFit
              ? "bg-primary/15 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/60 hover:bg-emerald-500 hover:text-background";

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => !disabled && onSelect(isSelected ? null : t.id)}
                disabled={disabled}
                aria-label={`Table ${t.id}, ${TYPE_LABEL[t.type]}, ${t.seats} seats, ${
                  booked ? "booked" : tooSmall ? "too small" : "available"
                }`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 border-2 transition-all flex flex-col items-center justify-center text-[10px] font-display ${sizeClass} ${stateClass}`}
                style={{ left: `${(t.x / 12) * 100}%`, top: `${(t.y / 8) * 100}%` }}
              >
                <span className="leading-none">{t.id}</span>
                <span className="text-[9px] opacity-80 mt-0.5">{t.seats}p</span>
                {isBestFit && !isSelected && (
                  <span aria-hidden className="absolute -top-1 -right-1 text-[10px]">★</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Skip option */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`mt-4 w-full rounded-xl border border-dashed py-3 text-xs uppercase tracking-widest transition-colors ${
          !selected
            ? "border-primary/60 bg-primary/5 text-primary"
            : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
        }`}
      >
        {!selected ? "✓ Let the restaurant pick the best table" : "Skip — let the restaurant choose"}
      </button>
    </div>
  );
};

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
    {label}
  </span>
);
