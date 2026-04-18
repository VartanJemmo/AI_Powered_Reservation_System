import { Link, useNavigate } from "react-router-dom";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";

const links = [
  { href: "#about", label: "About" },
  { href: "#menu", label: "Menu" },
  { href: "#order", label: "Pre-order" },
  { href: "#gallery", label: "Gallery" },
  { href: "#visit", label: "Visit" },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const scrollToReserve = () => {
    document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 backdrop-blur-md bg-background/60 border-b border-border/60">
      <div className="container-narrow flex h-16 items-center justify-between gap-3">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          {user?.role === "admin" && (
            <Link to="/admin" className="hover:text-primary transition-colors">Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${user.role === "admin" ? "bg-primary" : "bg-emerald-400"}`} />
                <span className="text-muted-foreground">
                  {user.role === "admin" ? "Manager" : user.name?.split(" ")[0] ?? "Guest"}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                aria-label="Sign out"
                title="Sign out"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M15 17l5-5-5-5M20 12H9M12 19a7 7 0 1 1 0-14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          )}
          <button
            onClick={scrollToReserve}
            className="rounded-full border border-primary/60 bg-primary/10 text-primary px-4 py-1.5 text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Reserve
          </button>
        </div>
      </div>
    </header>
  );
};
