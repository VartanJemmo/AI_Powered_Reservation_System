// Reservation reminder dispatcher.
// Runs on a 5-minute cron. Finds reservations starting in ~1.5–2.5 hours
// that haven't been reminded yet and (in dry-run mode) logs what WOULD be sent.
// Once a verified email domain is configured, flip DRY_RUN to false and add
// a real email send (e.g. via the send-transactional-email function).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Dry-run mode: when true, no real email is sent, but each candidate
// reminder is recorded in the reminder_log table with status = 'dry-run'.
const DRY_RUN = true;

// Reminder window: how far before the reservation we consider it "due".
// We aim for ~2 hours before, with a tolerance window because the cron
// runs every 5 minutes.
const REMIND_WINDOW_MIN_HOURS = 1.5; // earliest before reservation
const REMIND_WINDOW_MAX_HOURS = 2.5; // latest before reservation

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase env vars" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const now = new Date();
  const windowStart = new Date(now.getTime() + REMIND_WINDOW_MIN_HOURS * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + REMIND_WINDOW_MAX_HOURS * 60 * 60 * 1000);

  // We need today's and tomorrow's reservations to cover late-night bookings.
  const dates = new Set<string>();
  for (const d of [now, windowStart, windowEnd]) {
    dates.add(d.toISOString().slice(0, 10));
  }

  const { data: candidates, error } = await supabase
    .from("reservations")
    .select("*")
    .in("reservation_date", Array.from(dates))
    .is("reminder_sent_at", null)
    .eq("status", "confirmed");

  if (error) {
    console.error("Failed to fetch reservations:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const due = (candidates ?? []).filter((r) => {
    if (!r.reservation_time || r.reservation_time === "—") return false;
    const dt = new Date(`${r.reservation_date}T${r.reservation_time}:00`);
    return dt >= windowStart && dt <= windowEnd;
  });

  console.log(
    `Reminder run @ ${now.toISOString()} — checked ${candidates?.length ?? 0}, due ${due.length}`,
  );

  const results: Array<{ id: string; status: string; recipient: string | null }> = [];

  for (const r of due) {
    const recipient = r.email ?? null;
    const payload = {
      name: r.name,
      date: r.reservation_date,
      time: r.reservation_time,
      partySize: r.party_size,
      reservationId: r.id,
    };

    if (DRY_RUN) {
      const { error: logErr } = await supabase.from("reminder_log").insert({
        reservation_id: r.id,
        recipient_email: recipient,
        status: recipient ? "dry-run" : "skipped",
        channel: "email",
        error_message: recipient ? null : "No email on reservation",
        payload,
      });
      if (logErr) console.error("reminder_log insert failed:", logErr);

      // Mark as reminded so we don't loop on it
      const { error: updErr } = await supabase
        .from("reservations")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", r.id);
      if (updErr) console.error("reservation update failed:", updErr);

      results.push({ id: r.id, status: recipient ? "dry-run" : "skipped", recipient });
    } else {
      // Real send path — wired up once a verified email domain exists.
      // Will invoke send-transactional-email here.
      results.push({ id: r.id, status: "real-send-not-configured", recipient });
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      dryRun: DRY_RUN,
      checked: candidates?.length ?? 0,
      processed: results.length,
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
