import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const links = [
  { href: "#about", label: "About" },
  { href: "#menu", label: "Menu" },
  { href: "#gallery", label: "Gallery" },
  { href: "#visit", label: "Visit" },
];

export const Navbar = () => {
  const scrollToReserve = () => {
    document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <header className="fixed inset-x-0 top-0 z-40 backdrop-blur-md bg-background/60 border-b border-border/60">
      <div className="container-narrow flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </a>
          ))}
          <Link to="/admin" className="hover:text-foreground transition-colors">Admin</Link>
        </nav>
        <button
          onClick={scrollToReserve}
          className="rounded-full border border-primary/60 bg-primary/10 text-primary px-4 py-1.5 text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          Reserve
        </button>
      </div>
    </header>
  );
};
