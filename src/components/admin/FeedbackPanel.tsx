import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Star } from "lucide-react";

type FeedbackRow = {
  id: string;
  guest_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  feedback_type: "praise" | "complaint";
  rating: number;
  message: string;
  status: string;
  created_at: string;
};

type Filter = "all" | "new" | "resolved" | "praise" | "complaint";

export const FeedbackPanel = () => {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const reload = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Couldn't load feedback.");
    } else {
      setRows((data ?? []) as FeedbackRow[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    reload();
    const channel = supabase
      .channel("admin-feedback")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "feedback" },
        () => reload()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === "all") return true;
      if (filter === "new" || filter === "resolved") return r.status === filter;
      return r.feedback_type === filter;
    });
  }, [rows, filter]);

  const stats = useMemo(() => {
    const total = rows.length;
    const complaints = rows.filter((r) => r.feedback_type === "complaint").length;
    const praise = rows.filter((r) => r.feedback_type === "praise").length;
    const open = rows.filter((r) => r.status === "new").length;
    const avg = total > 0 ? rows.reduce((s, r) => s + r.rating, 0) / total : 0;
    return { total, complaints, praise, open, avg };
  }, [rows]);

  const toggleResolved = async (r: FeedbackRow) => {
    const next = r.status === "resolved" ? "new" : "resolved";
    const { error } = await supabase
      .from("feedback")
      .update({ status: next })
      .eq("id", r.id);
    if (error) {
      toast.error("Couldn't update status.");
    } else {
      toast.success(next === "resolved" ? "Marked as resolved." : "Reopened.");
    }
  };

  const remove = async (r: FeedbackRow) => {
    if (!confirm(`Delete feedback from ${r.guest_name}?`)) return;
    const { error } = await supabase.from("feedback").delete().eq("id", r.id);
    if (error) toast.error("Couldn't delete.");
    else toast.success("Deleted.");
  };

  return (
    <section>
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Guest feedback</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compliments and complaints from the website form.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat k="Total" v={String(stats.total)} />
        <Stat k="Open" v={String(stats.open)} accent={stats.open > 0 ? "primary" : undefined} />
        <Stat k="Praise" v={String(stats.praise)} />
        <Stat k="Complaints" v={String(stats.complaints)} accent={stats.complaints > 0 ? "destructive" : undefined} />
        <Stat k="Avg rating" v={stats.avg ? stats.avg.toFixed(1) : "—"} />
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {(["all", "new", "resolved", "praise", "complaint"] as Filter[]).map((f) => (
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

      <div className="mt-6 rounded-2xl border border-border overflow-hidden">
        {loading && rows.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">Loading…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? "No feedback yet. The form on the homepage will populate this list."
              : "No feedback matches your filter."}
          </div>
        )}

        {filtered.map((r) => (
          <div
            key={r.id}
            className="border-t border-border first:border-t-0 px-4 lg:px-5 py-5 hover:bg-secondary/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{r.guest_name}</span>
                  <TypePill type={r.feedback_type} />
                  <StatusPill status={r.status} />
                  <Stars rating={r.rating} />
                </div>
                <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                  {r.guest_email && <span>{r.guest_email}</span>}
                  {r.guest_phone && <span>{r.guest_phone}</span>}
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap">{r.message}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {r.guest_email && (
                  <a
                    href={`mailto:${r.guest_email}?subject=${encodeURIComponent("Re: your feedback at Mayrig")}`}
                    className="text-xs rounded-full border border-border px-3 py-1.5 hover:border-primary/40 transition-colors"
                  >
                    Reply
                  </a>
                )}
                <button
                  onClick={() => toggleResolved(r)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                    r.status === "resolved"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "border-border hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  {r.status === "resolved" ? "Reopen" : "Resolve"}
                </button>
                <button
                  onClick={() => remove(r)}
                  className="text-xs rounded-full border border-border px-3 py-1.5 hover:border-destructive/60 hover:text-destructive transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const Stat = ({ k, v, accent }: { k: string; v: string; accent?: "destructive" | "primary" }) => (
  <div className="rounded-2xl border border-border bg-card p-5">
    <div className="text-xs uppercase tracking-widest text-muted-foreground">{k}</div>
    <div
      className={`font-display text-3xl mt-1 ${
        accent === "destructive" ? "text-destructive" : "gold-text"
      }`}
    >
      {v}
    </div>
  </div>
);

const TypePill = ({ type }: { type: "praise" | "complaint" }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
      type === "complaint"
        ? "border-destructive/40 text-destructive bg-destructive/10"
        : "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
    }`}
  >
    {type}
  </span>
);

const StatusPill = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-widest ${
      status === "resolved"
        ? "bg-muted text-muted-foreground border-border"
        : "bg-primary/15 text-primary border-primary/30"
    }`}
  >
    {status}
  </span>
);

const Stars = ({ rating }: { rating: number }) => (
  <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        className={`h-3.5 w-3.5 ${
          n <= rating ? "fill-primary text-primary" : "text-muted-foreground/30"
        }`}
      />
    ))}
  </span>
);
