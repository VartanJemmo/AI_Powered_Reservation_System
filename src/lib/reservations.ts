// Mock real-time availability + reservation store
export type Reservation = {
  id: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  partySize: number;
  name: string;
  phone: string;
  email?: string;
  deposit: boolean;
  notes?: string;
  status: "confirmed" | "no-show" | "seated" | "waitlist";
  createdAt: string;
};

const STORAGE_KEY = "mayrig.reservations.v1";
const SLOT_CAPACITY = 12; // covers per 30-min slot
const POPULAR_TIMES = new Set(["19:00", "19:30", "20:00", "20:30"]);

export const ALL_TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 18; h <= 22; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h !== 22) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

export function loadReservations(): Reservation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Reservation[]) : seed();
  } catch {
    return [];
  }
}

function saveAll(list: Reservation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function seed(): Reservation[] {
  // Pre-seed some bookings to make availability realistic
  const today = new Date().toISOString().slice(0, 10);
  const seeded: Reservation[] = [
    mk(today, "19:00", 4, "Anush K."),
    mk(today, "19:00", 2, "Garo M."),
    mk(today, "19:30", 6, "Lara T."),
    mk(today, "20:00", 4, "Vahe P."),
    mk(today, "20:00", 3, "Sona A."),
    mk(today, "20:30", 5, "Hagop D."),
    mk(today, "21:00", 2, "Nareh S."),
  ];
  saveAll(seeded);
  return seeded;
}

function mk(date: string, time: string, partySize: number, name: string): Reservation {
  return {
    id: crypto.randomUUID(),
    date, time, partySize, name,
    phone: "+961 70 000 000",
    deposit: false,
    status: "confirmed",
    createdAt: new Date().toISOString(),
  };
}

export type SlotInfo = {
  time: string;
  bookedCovers: number;
  remaining: number;
  status: "available" | "limited" | "full";
  popular: boolean;
};

export function getSlotsForDate(date: string, party: number = 2): SlotInfo[] {
  const all = loadReservations();
  return ALL_TIMES.map((time) => {
    const booked = all
      .filter((r) => r.date === date && r.time === time && r.status !== "no-show")
      .reduce((s, r) => s + r.partySize, 0);
    const remaining = Math.max(0, SLOT_CAPACITY - booked);
    const fits = remaining >= party;
    let status: SlotInfo["status"] = "available";
    if (!fits) status = "full";
    else if (remaining <= 4) status = "limited";
    return { time, bookedCovers: booked, remaining, status, popular: POPULAR_TIMES.has(time) };
  });
}

export function nextAvailable(date: string, party: number, around?: string): SlotInfo[] {
  const slots = getSlotsForDate(date, party).filter((s) => s.status !== "full");
  if (!around) return slots.slice(0, 4);
  const idx = ALL_TIMES.indexOf(around);
  return slots
    .map((s) => ({ s, d: Math.abs(ALL_TIMES.indexOf(s.time) - idx) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 4)
    .map((x) => x.s);
}

export function createReservation(input: Omit<Reservation, "id" | "createdAt" | "status"> & { status?: Reservation["status"] }): Reservation {
  const all = loadReservations();
  const r: Reservation = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    status: input.status ?? "confirmed",
  };
  all.push(r);
  saveAll(all);
  return r;
}

export function updateReservationStatus(id: string, status: Reservation["status"]) {
  const all = loadReservations();
  const next = all.map((r) => (r.id === id ? { ...r, status } : r));
  saveAll(next);
  return next;
}

export function getReservation(id: string): Reservation | undefined {
  return loadReservations().find((r) => r.id === id);
}

export function formatDateLong(date: string) {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function todayISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export const SLOT_CAPACITY_VALUE = SLOT_CAPACITY;
