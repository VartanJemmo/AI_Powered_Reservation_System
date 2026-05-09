// Supabase-backed reservations + availability.
// Reservations are now stored server-side so the scheduled reminder job
// can see them. The same shape is preserved so existing UI keeps working.
import { supabase } from "@/integrations/supabase/client";

export type Seating = "non-smoking" | "smoking" | "outdoor";

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
  seating: Seating;
  status: "confirmed" | "no-show" | "seated" | "waitlist";
  tableId?: string;
  createdAt: string;
};

export const SEATING_LABELS: Record<Seating, string> = {
  "non-smoking": "Non-smoking",
  "smoking": "Smoking",
  "outdoor": "Outdoor",
};

const SLOT_CAPACITY = 140;
const POPULAR_TIMES = new Set(["19:00", "19:30", "20:00", "20:30"]);

export const ALL_TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 18; h <= 22; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h !== 22) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

// Local cache so synchronous helpers (getSlotsForDate, etc.) keep working.
// The cache is refreshed by refreshReservations() and after every mutation.
let cache: Reservation[] = [];
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((cb) => cb());
}

export function subscribeReservations(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

type Row = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  deposit: boolean;
  notes: string | null;
  seating: Seating;
  status: Reservation["status"];
  table_id?: string | null;
  created_at: string;
};

function rowToReservation(r: Row): Reservation {
  return {
    id: r.id,
    date: r.reservation_date,
    time: r.reservation_time,
    partySize: r.party_size,
    name: r.name,
    phone: r.phone,
    email: r.email ?? undefined,
    deposit: r.deposit,
    notes: r.notes ?? undefined,
    seating: (r.seating ?? "non-smoking") as Seating,
    status: r.status,
    tableId: r.table_id ?? undefined,
    createdAt: r.created_at,
  };
}

export async function refreshReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true });
  if (error) {
    console.error("refreshReservations failed:", error);
    return cache;
  }
  cache = (data as Row[]).map(rowToReservation);
  notify();
  return cache;
}

export function loadReservations(): Reservation[] {
  return cache;
}

export type SlotInfo = {
  time: string;
  bookedCovers: number;
  remaining: number;
  status: "available" | "limited" | "full";
  popular: boolean;
};

export function getSlotsForDate(date: string, party: number = 2): SlotInfo[] {
  return ALL_TIMES.map((time) => {
    const booked = cache
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

export async function createReservation(
  input: Omit<Reservation, "id" | "createdAt" | "status"> & { status?: Reservation["status"] },
): Promise<Reservation> {
  const insertRow: Record<string, unknown> = {
    name: input.name,
    phone: input.phone,
    email: input.email ?? null,
    party_size: input.partySize,
    reservation_date: input.date,
    reservation_time: input.time,
    deposit: input.deposit,
    notes: input.notes ?? null,
    seating: input.seating,
    status: input.status ?? "confirmed",
  };
  if (input.tableId) insertRow.table_id = input.tableId;
  const { data, error } = await supabase
    .from("reservations")
    .insert(insertRow as never)
    .select("*")
    .single();
  if (error || !data) {
    console.error("createReservation failed:", error);
    throw error ?? new Error("Failed to create reservation");
  }
  const r = rowToReservation(data as Row);
  cache = [...cache, r];
  notify();
  return r;
}

/**
 * Returns the set of table IDs already booked for a given date+time.
 * A confirmed reservation that has a tableId blocks that table for that slot.
 */
export function getBookedTables(date: string, time: string): Set<string> {
  const out = new Set<string>();
  for (const r of cache) {
    if (r.date !== date || r.time !== time) continue;
    if (r.status === "no-show") continue;
    if (r.tableId) out.add(r.tableId);
  }
  return out;
}

export async function updateReservationStatus(id: string, status: Reservation["status"]) {
  const { error } = await supabase
    .from("reservations")
    .update({ status })
    .eq("id", id);
  if (error) {
    console.error("updateReservationStatus failed:", error);
    return cache;
  }
  cache = cache.map((r) => (r.id === id ? { ...r, status } : r));
  notify();
  return cache;
}

export async function updateReservationPartySize(id: string, partySize: number): Promise<Reservation | undefined> {
  const size = Math.max(1, Math.min(20, Math.floor(partySize)));
  const { data, error } = await supabase
    .from("reservations")
    .update({ party_size: size })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    console.error("updateReservationPartySize failed:", error);
    throw error ?? new Error("Failed to update party size");
  }
  const r = rowToReservation(data as Row);
  cache = cache.map((x) => (x.id === id ? r : x));
  notify();
  return r;
}

export async function updateReservation(
  id: string,
  patch: Partial<Pick<Reservation, "partySize" | "notes" | "time" | "date" | "seating" | "phone" | "email" | "name">>,
): Promise<Reservation | undefined> {
  const update: Record<string, unknown> = {};
  if (patch.partySize !== undefined) update.party_size = Math.max(1, Math.min(20, Math.floor(patch.partySize)));
  if (patch.notes !== undefined) update.notes = patch.notes || null;
  if (patch.time !== undefined) update.reservation_time = patch.time;
  if (patch.date !== undefined) update.reservation_date = patch.date;
  if (patch.seating !== undefined) update.seating = patch.seating;
  if (patch.phone !== undefined) update.phone = patch.phone;
  if (patch.email !== undefined) update.email = patch.email || null;
  if (patch.name !== undefined) update.name = patch.name;
  if (Object.keys(update).length === 0) return cache.find((r) => r.id === id);
  const { data, error } = await supabase
    .from("reservations")
    .update(update as never)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    console.error("updateReservation failed:", error);
    throw error ?? new Error("Failed to update reservation");
  }
  const r = rowToReservation(data as Row);
  cache = cache.map((x) => (x.id === id ? r : x));
  notify();
  return r;
}

export async function deleteReservation(id: string): Promise<void> {
  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) {
    console.error("deleteReservation failed:", error);
    throw error;
  }
  cache = cache.filter((r) => r.id !== id);
  notify();
}

export async function getReservation(id: string): Promise<Reservation | undefined> {
  const local = cache.find((r) => r.id === id);
  if (local) return local;
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return undefined;
  return rowToReservation(data as Row);
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

// Reminder log read for the admin dashboard
export type ReminderLogEntry = {
  id: string;
  reservation_id: string;
  recipient_email: string | null;
  status: "dry-run" | "sent" | "failed" | "skipped";
  channel: string;
  error_message: string | null;
  payload: any;
  created_at: string;
};

export async function fetchReminderLog(limit = 50): Promise<ReminderLogEntry[]> {
  const { data, error } = await supabase
    .from("reminder_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("fetchReminderLog failed:", error);
    return [];
  }
  return data as ReminderLogEntry[];
}

export async function triggerRemindersNow() {
  const { data, error } = await supabase.functions.invoke(
    "send-reservation-reminders",
    { body: { manual: true } },
  );
  if (error) throw error;
  return data;
}
