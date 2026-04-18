import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ALL_TIMES,
  createReservation,
  formatDateLong,
  getSlotsForDate,
  nextAvailable,
  todayISO,
  type SlotInfo,
} from "@/lib/reservations";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

type Step = 1 | 2 | 3 | 4;

const partyOptions = [1, 2, 3, 4, 5, 6, 7, 8];

function buildDateOptions(days = 14) {
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

export const ReservationWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [date, setDate] = useState<string>(todayISO());
  const [party, setParty] = useState<number>(2);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notes, setNotes] = useState("");
  const [deposit, setDeposit] = useState(false);
  const [waitlist, setWaitlist] = useState(false);

  // If the user logs in mid-flow, prefill empty fields
  useEffect(() => {
    if (user?.role === "guest") {
      if (!name && user.name) setName(user.name);
      if (!phone && user.phone) setPhone(user.phone);
      if (!email && user.email) setEmail(user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const dates = useMemo(() => buildDateOptions(14), []);
  const slots = useMemo<SlotInfo[]>(() => getSlotsForDate(date, party), [date, party]);
  const allFull = slots.every((s) => s.status === "full");
  const remainingTotal = slots.reduce((acc, s) => acc + (s.status !== "full" ? 1 : 0), 0);

  // Auto-clear chosen time if it becomes invalid
  useEffect(() => {
    if (time && !slots.find((s) => s.time === time && s.status !== "full")) setTime(null);
  }, [slots, time]);

  const goNext = () => setStep((s) => Math.min(4, s + 1) as Step);
  const goBack = () => setStep((s) => Math.max(1, s - 1) as Step);

  const submit = async (asWaitlist = false) => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Please add your name and phone");
      return;
    }
    if (!asWaitlist && !time) {
      toast.error("Please pick a time");
      return;
    }
    try {
      const r = await createReservation({
        date,
        time: time ?? "—",
        partySize: party,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        deposit,
        status: asWaitlist ? "waitlist" : "confirmed",
      });
      navigate(`/confirmation/${r.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not save your reservation. Please try again.");
    }
  };

  return (
    <section id="reserve" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-50 pointer-events-none" aria-hidden />
      <div className="container-wide relative">
        <div className="text-center max-w-xl mx-auto">
          <span className="eyebrow justify-center"><span className="gold-divider" /> Reservations</span>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">Reserve your table</h2>
          <p className="mt-3 text-muted-foreground">Real-time availability — takes under a minute.</p>
        </div>

        <div className="mt-10 mx-auto grid lg:grid-cols-[1fr_360px] gap-6 max-w-5xl items-start">
          <div className="glass-card overflow-hidden">
            <Stepper step={step} />

          <div className="p-5 sm:p-7">
            {step === 1 && (
              <div className="animate-fade-in">
                <Label>Choose a date</Label>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
                  {dates.map((d, i) => {
                    const active = d.iso === date;
                    return (
                      <button
                        key={d.iso}
                        onClick={() => setDate(d.iso)}
                        className={`shrink-0 w-16 sm:w-20 rounded-xl border px-2 py-3 text-center transition-all ${
                          active
                            ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold"
                            : "border-border bg-secondary/40 hover:border-primary/40"
                        }`}
                      >
                        <div className="text-[10px] uppercase tracking-widest opacity-80">{d.weekday}</div>
                        <div className={`text-xl font-display ${active ? "" : ""}`}>{d.day}</div>
                        <div className="text-[10px] uppercase tracking-widest opacity-80">{d.month}</div>
                        {i === 0 && (
                          <div className={`mt-1 text-[9px] uppercase tracking-widest ${active ? "" : "text-primary"}`}>Today</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-7">
                  <Label>Party size</Label>
                  <div className="mt-3 grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {partyOptions.map((n) => {
                      const active = party === n;
                      return (
                        <button
                          key={n}
                          onClick={() => setParty(n)}
                          className={`h-12 rounded-xl border text-sm transition-all ${
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

                <Footer
                  onNext={goNext}
                  nextLabel="Show times"
                  hint={`${formatDateLong(date)} · ${party} ${party === 1 ? "guest" : "guests"}`}
                />
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <Label>Available times</Label>
                  <p className="text-xs text-muted-foreground">
                    {formatDateLong(date)} · {party} {party === 1 ? "guest" : "guests"}
                  </p>
                </div>

                {!allFull && remainingTotal <= 4 && (
                  <p className="mt-3 inline-flex items-center gap-2 text-xs text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Only a few spots left tonight
                  </p>
                )}

                {allFull ? (
                  <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-5">
                    <p className="font-display text-xl">Fully booked</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All times are taken for this date. Try another day or join the waitlist.
                    </p>
                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Next available</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {nextAvailable(date, party).map((s) => (
                          <button
                            key={s.time}
                            onClick={() => { setTime(s.time); goNext(); }}
                            className="rounded-full border border-primary/40 bg-primary/10 text-primary px-4 py-2 text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => { setWaitlist(true); setStep(3); }}
                      className="mt-5 w-full rounded-xl border border-border bg-background py-3 text-sm hover:border-primary/40 transition-colors"
                    >
                      Join the waitlist
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((s) => {
                      const disabled = s.status === "full";
                      const active = time === s.time;
                      return (
                        <button
                          key={s.time}
                          disabled={disabled}
                          onClick={() => setTime(s.time)}
                          className={`relative h-14 rounded-xl border text-sm transition-all ${
                            active
                              ? "bg-gradient-gold text-primary-foreground border-transparent shadow-gold scale-[1.02]"
                              : disabled
                              ? "border-border/40 bg-secondary/20 text-muted-foreground/40 line-through cursor-not-allowed"
                              : "border-border bg-secondary/40 hover:border-primary/60 hover:bg-secondary"
                          }`}
                        >
                          {s.time}
                          {s.popular && !disabled && !active && (
                            <span className="absolute -top-1.5 -right-1.5 text-[9px] uppercase tracking-widest bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                              Popular
                            </span>
                          )}
                          {s.status === "limited" && !active && !disabled && (
                            <span className="absolute bottom-1 inset-x-0 text-[9px] uppercase tracking-widest text-primary/90">
                              Few left
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {!allFull && time && (
                  <div className="mt-4 text-xs text-muted-foreground">
                    Selected: <span className="text-foreground">{time}</span>. Prefer a different time?
                    <span className="ml-1">Try {nextAvailable(date, party, time).filter(s => s.time !== time).slice(0,3).map(s => s.time).join(" · ")}</span>
                  </div>
                )}

                <Footer
                  onBack={goBack}
                  onNext={() => time && goNext()}
                  nextDisabled={!time}
                  nextLabel="Continue"
                />
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in space-y-4">
                <Label>Your details</Label>
                <Field label="Full name" value={name} onChange={setName} placeholder="Anna Mardirossian" required />
                <Field label="Phone" value={phone} onChange={setPhone} placeholder="+961 70 000 000" type="tel" required />
                <Field label="Email (optional)" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
                <Field label="Special requests (optional)" value={notes} onChange={setNotes} placeholder="Allergies, occasion…" textarea />

                <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-4">
                  <button
                    type="button"
                    onClick={() => setDeposit((v) => !v)}
                    aria-pressed={deposit}
                    className={`mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors relative ${
                      deposit ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
                        deposit ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm">Secure with a $10/guest deposit</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Refunded with your bill. Helps us hold your table.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground inline-flex items-center gap-2">
                  <span aria-hidden>🔔</span> You'll receive a reminder before your booking.
                </p>

                <Footer
                  onBack={goBack}
                  onNext={goNext}
                  nextLabel="Review"
                  nextDisabled={!name.trim() || !phone.trim()}
                />
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in">
                <Label>Confirm your reservation</Label>
                <div className="mt-4 rounded-xl border border-border bg-secondary/40 p-5 space-y-3 text-sm">
                  <Row k="Date" v={formatDateLong(date)} />
                  <Row k="Time" v={waitlist ? "Waitlist" : time ?? "—"} />
                  <Row k="Party" v={`${party} ${party === 1 ? "guest" : "guests"}`} />
                  <Row k="Name" v={name} />
                  <Row k="Phone" v={phone} />
                  {email && <Row k="Email" v={email} />}
                  {notes && <Row k="Notes" v={notes} />}
                  <Row k="Deposit" v={deposit ? "Yes — $10/guest" : "No"} />
                </div>

                <button
                  onClick={() => submit(waitlist)}
                  className="mt-5 w-full rounded-full bg-gradient-gold text-primary-foreground py-4 text-sm uppercase tracking-[0.2em] font-medium shadow-gold"
                >
                  {waitlist ? "Join waitlist" : "Confirm reservation"}
                </button>
                <button
                  onClick={goBack}
                  className="mt-3 w-full rounded-full border border-border py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop summary side panel */}
        <aside className="hidden lg:block sticky top-24 glass-card overflow-hidden">
          <div className="p-6 border-b border-border">
            <span className="eyebrow"><span className="gold-divider" /> Your booking</span>
            <h3 className="mt-3 font-display text-2xl">Mayrig</h3>
            <p className="text-xs text-muted-foreground mt-1">Pasteur Street, Gemmayze · Beirut</p>
          </div>
          <dl className="p-6 space-y-4 text-sm">
            <SummaryRow k="Date" v={formatDateLong(date)} />
            <SummaryRow k="Party" v={`${party} ${party === 1 ? "guest" : "guests"}`} />
            <SummaryRow k="Time" v={time ?? <span className="text-muted-foreground">Pick a time</span>} />
            {name && <SummaryRow k="Guest" v={name} />}
            {phone && <SummaryRow k="Phone" v={phone} />}
            <SummaryRow k="Deposit" v={deposit ? "$10/guest held" : "—"} />
          </dl>
          <div className="px-6 pb-6">
            <div className="rounded-xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
              🔔 We'll text you a reminder the day before. Modify or cancel any time.
            </div>
          </div>
        </aside>
        </div>
      </div>
    </section>
  );
};

const SummaryRow = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4">
    <dt className="text-[10px] uppercase tracking-widest text-primary/90 pt-0.5">{k}</dt>
    <dd className="text-right text-foreground">{v}</dd>
  </div>
);

const Stepper = ({ step }: { step: Step }) => {
  const labels = ["Date & party", "Time", "Details", "Confirm"];
  return (
    <div className="flex items-center gap-2 px-5 sm:px-7 pt-5">
      {labels.map((l, i) => {
        const idx = (i + 1) as Step;
        const active = step === idx;
        const done = step > idx;
        return (
          <div key={l} className="flex-1 flex items-center gap-2">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                done || active ? "bg-primary" : "bg-border"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-xs uppercase tracking-[0.25em] text-primary/90">{children}</h3>
);

const Footer = ({
  onBack, onNext, nextLabel = "Next", nextDisabled, hint,
}: {
  onBack?: () => void; onNext?: () => void; nextLabel?: string; nextDisabled?: boolean; hint?: string;
}) => (
  <div className="mt-7 flex items-center justify-between gap-3 flex-wrap">
    <div className="text-xs text-muted-foreground">{hint}</div>
    <div className="flex gap-2 ml-auto">
      {onBack && (
        <button onClick={onBack} className="rounded-full border border-border px-5 py-3 text-sm hover:border-primary/40 transition-colors">
          Back
        </button>
      )}
      {onNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="rounded-full bg-gradient-gold text-primary-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest shadow-gold disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {nextLabel}
        </button>
      )}
    </div>
  </div>
);

const Field = ({
  label, value, onChange, placeholder, type = "text", required, textarea,
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; required?: boolean; textarea?: boolean;
}) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}{required && <span className="text-primary"> *</span>}</span>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1.5 w-full rounded-xl border border-border bg-input/60 px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full h-12 rounded-xl border border-border bg-input/60 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
      />
    )}
  </label>
);

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-start justify-between gap-4">
    <span className="text-muted-foreground">{k}</span>
    <span className="text-right text-foreground">{v}</span>
  </div>
);
