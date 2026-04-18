import { useState } from "react";
import { z } from "zod";
import { Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { submitFeedback } from "@/lib/feedback";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const feedbackSchema = z.object({
  guestName: z.string().trim().min(2, "Please share your name").max(80),
  guestEmail: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  guestPhone: z.string().trim().max(40).optional().or(z.literal("")),
  feedbackType: z.enum(["praise", "complaint"]),
  rating: z.number().int().min(1, "Please rate from 1 to 5 stars").max(5),
  message: z.string().trim().min(10, "Please share a few more words (10+ chars)").max(2000),
});

export const Feedback = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [type, setType] = useState<"praise" | "complaint">("praise");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = feedbackSchema.safeParse({
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
      feedbackType: type,
      rating,
      message,
    });
    if (!parsed.success) {
      toast({
        title: "Please review your feedback",
        description: parsed.error.issues[0]?.message ?? "Some fields need attention.",
        variant: "destructive",
      });
      return;
    }
    setSubmitting(true);
    try {
      await submitFeedback({
        guestName: parsed.data.guestName,
        guestEmail: parsed.data.guestEmail || undefined,
        guestPhone: parsed.data.guestPhone || undefined,
        feedbackType: parsed.data.feedbackType,
        rating: parsed.data.rating,
        message: parsed.data.message,
      });
      setDone(true);
      setMessage("");
      setRating(0);
      toast({
        title: "Thank you for your feedback",
        description:
          type === "complaint"
            ? "Our manager has been alerted and will be in touch."
            : "We've passed your kind words to the team.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Couldn't send your feedback",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="feedback" className="container-narrow py-20 sm:py-28 scroll-mt-24">
      <div className="text-center max-w-2xl mx-auto">
        <span className="eyebrow justify-center">
          <span className="gold-divider" /> Share your experience <span className="gold-divider" />
        </span>
        <h2 className="mt-4 font-display text-4xl sm:text-5xl">How was your visit?</h2>
        <p className="mt-3 text-muted-foreground">
          Compliments make our day — and concerns help us do better. Either way, we read every word.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-12 max-w-2xl mx-auto glass-card p-6 sm:p-8 space-y-6"
      >
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-secondary/40 border border-border">
          {(["praise", "complaint"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-full py-2.5 text-sm font-medium uppercase tracking-widest transition-colors",
                type === t
                  ? "bg-gradient-gold text-primary-foreground shadow-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "praise" ? "Compliment" : "Complaint"}
            </button>
          ))}
        </div>

        {/* Stars */}
        <div className="text-center">
          <label className="block text-xs uppercase tracking-widest text-primary/90 mb-3">
            Rate your experience
          </label>
          <div
            className="flex justify-center gap-2"
            onMouseLeave={() => setHoverRating(0)}
            role="radiogroup"
            aria-label="Star rating"
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hoverRating || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  className="p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                >
                  <Star
                    className={cn(
                      "h-9 w-9 transition-colors",
                      active ? "fill-primary text-primary" : "text-muted-foreground/40"
                    )}
                  />
                </button>
              );
            })}
          </div>
          {rating > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {["", "Disappointing", "Could be better", "Good", "Great", "Exceptional"][rating]}
            </p>
          )}
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Your name *">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Ani Sarkissian"
            />
          </Field>
          <Field label="Email (optional)">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
              className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="+961 70 123 456"
            />
          </Field>
        </div>

        {/* Message */}
        <Field label={type === "complaint" ? "Tell us what went wrong *" : "Share what you loved *"}>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            minLength={10}
            maxLength={2000}
            className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            placeholder={
              type === "complaint"
                ? "Please describe your experience so we can make it right…"
                : "What stood out? Dishes, service, atmosphere…"
            }
          />
          <div className="text-xs text-muted-foreground text-right mt-1">
            {message.length}/2000
          </div>
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-gradient-gold text-primary-foreground py-3.5 text-sm uppercase tracking-widest font-medium shadow-gold disabled:opacity-60 transition-opacity"
        >
          {submitting ? "Sending…" : done ? "Send another" : "Send feedback"}
        </button>

        {done && (
          <p className="text-center text-sm text-muted-foreground">
            ✓ We've received your feedback. Thank you for taking the time.
          </p>
        )}
      </form>
    </section>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] uppercase tracking-widest text-primary/90 mb-1.5">
      {label}
    </label>
    {children}
  </div>
);
