import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type State =
  | { kind: "validating" }
  | { kind: "valid" }
  | { kind: "already" }
  | { kind: "invalid"; message: string }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<State>({ kind: "validating" });

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid", message: "Missing unsubscribe token." });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON_KEY } },
        );
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.valid === true) {
          setState({ kind: "valid" });
        } else if (data.reason === "already_unsubscribed") {
          setState({ kind: "already" });
        } else {
          setState({
            kind: "invalid",
            message: data.error ?? "This unsubscribe link is invalid or expired.",
          });
        }
      } catch (e: any) {
        if (cancelled) return;
        setState({ kind: "invalid", message: e?.message ?? "Could not validate link." });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    setState({ kind: "submitting" });
    const { data, error } = await supabase.functions.invoke(
      "handle-email-unsubscribe",
      { body: { token } },
    );
    if (error) {
      setState({ kind: "error", message: error.message });
      return;
    }
    if (data?.success || data?.reason === "already_unsubscribed") {
      setState({ kind: "done" });
    } else {
      setState({ kind: "error", message: "Something went wrong. Please try again." });
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md p-8 bg-card border-border">
        <h1 className="font-serif text-3xl text-foreground mb-2">Mayrig</h1>
        <div className="h-0.5 w-12 bg-primary mb-6" />
        <h2 className="text-xl font-medium text-foreground mb-4">
          Email preferences
        </h2>

        {state.kind === "validating" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking your link…
          </div>
        )}

        {state.kind === "valid" && (
          <>
            <p className="text-muted-foreground mb-6">
              Click below to unsubscribe from reservation reminders and other
              emails from Mayrig.
            </p>
            <Button onClick={handleConfirm} className="w-full">
              Confirm unsubscribe
            </Button>
          </>
        )}

        {state.kind === "submitting" && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating your preferences…
          </div>
        )}

        {(state.kind === "done" || state.kind === "already") && (
          <p className="text-foreground">
            {state.kind === "done"
              ? "You've been unsubscribed. We're sorry to see you go."
              : "This email address is already unsubscribed."}
          </p>
        )}

        {(state.kind === "invalid" || state.kind === "error") && (
          <p className="text-destructive">{state.message}</p>
        )}
      </Card>
    </main>
  );
}
