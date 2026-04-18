import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

type Mode = "choose" | "guest" | "admin";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string; error?: string } };
  const { user, loginGuest, loginAdmin } = useAuth();
  const [mode, setMode] = useState<Mode>("choose");

  // Guest form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Admin form
  const [password, setPassword] = useState("");

  useEffect(() => {
    document.title = "Sign in · Mayrig";
    if (location.state?.error === "admin-required") {
      toast.error("Admin access required");
    }
  }, [location.state]);

  // Already signed in → redirect
  useEffect(() => {
    if (user) {
      const dest = location.state?.from && location.state.from !== "/login"
        ? location.state.from
        : user.role === "admin" ? "/admin" : "/";
      navigate(dest, { replace: true });
    }
  }, [user, navigate, location.state]);

  const submitGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Name and phone are required");
      return;
    }
    loginGuest({ name: name.trim(), phone: phone.trim(), email: email.trim() || undefined });
    toast.success(`Welcome, ${name.split(" ")[0]}`);
  };

  const submitAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = loginAdmin(password);
    if (!ok) {
      toast.error("Incorrect password");
      return;
    }
    toast.success("Signed in as Manager");
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 bg-gradient-radial-gold opacity-60 pointer-events-none" aria-hidden />

      <header className="container-narrow pt-8 relative">
        <Link to="/" aria-label="Back to home"><Logo /></Link>
      </header>

      <section className="container-narrow relative flex-1 grid place-items-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center animate-fade-up">
            <span className="eyebrow justify-center">
              <span className="gold-divider" /> Welcome <span className="gold-divider" />
            </span>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl">Sign in to continue</h1>
            <p className="mt-3 text-muted-foreground">
              {mode === "choose"
                ? "Choose how you'd like to enter Mayrig."
                : mode === "guest"
                ? "Tell us a little about you to start booking."
                : "Manager access — enter your password."}
            </p>
          </div>

          <div className="mt-10 glass-card p-6 sm:p-8 animate-fade-in">
            {mode === "choose" && (
              <div className="space-y-3">
                <button
                  onClick={() => setMode("guest")}
                  className="group w-full rounded-xl border border-border bg-secondary/40 p-5 text-left hover:border-primary/60 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center text-primary">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl">Continue as Guest</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Book a table, get reminders, and view your reservation.
                      </p>
                    </div>
                    <span className="text-primary opacity-60 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>

                <button
                  onClick={() => setMode("admin")}
                  className="group w-full rounded-xl border border-border bg-secondary/40 p-5 text-left hover:border-primary/60 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/15 grid place-items-center text-primary">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-xl">Manager Login</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Access the admin dashboard with reservations & no-shows.
                      </p>
                    </div>
                    <span className="text-primary opacity-60 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>
              </div>
            )}

            {mode === "guest" && (
              <form onSubmit={submitGuest} className="space-y-4 animate-fade-in">
                <Field label="Full name" value={name} onChange={setName} placeholder="Anna Mardirossian" required />
                <Field label="Phone" type="tel" value={phone} onChange={setPhone} placeholder="+961 70 000 000" required />
                <Field label="Email (optional)" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <button
                  type="submit"
                  className="mt-2 w-full rounded-full bg-gradient-gold text-primary-foreground py-4 text-sm uppercase tracking-[0.2em] font-medium shadow-gold"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </form>
            )}

            {mode === "admin" && (
              <form onSubmit={submitAdmin} className="space-y-4 animate-fade-in">
                <Field
                  label="Manager password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Demo password: <span className="text-primary font-mono">manager</span>
                </p>
                <button
                  type="submit"
                  className="mt-2 w-full rounded-full bg-gradient-gold text-primary-foreground py-4 text-sm uppercase tracking-[0.2em] font-medium shadow-gold"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("choose")}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back
                </button>
              </form>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By continuing you agree to our reservation terms.
          </p>
        </div>
      </section>
    </main>
  );
};

const Field = ({
  label, value, onChange, placeholder, type = "text", required, autoFocus,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; autoFocus?: boolean;
}) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-muted-foreground">
      {label}{required && <span className="text-primary"> *</span>}
    </span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="mt-1.5 w-full h-12 rounded-xl border border-border bg-input/60 px-4 text-sm focus:outline-none focus:border-primary transition-colors"
    />
  </label>
);

export default Login;
