import { Logo } from "./Logo";

export const Footer = () => (
  <footer className="border-t border-border/60 py-10 mt-10">
    <div className="container-narrow flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
      <Logo />
      <p>© {new Date().getFullYear()} Mayrig — Crafted with heritage.</p>
      <div className="flex gap-5">
        <a href="#" className="hover:text-primary">Instagram</a>
        <a href="#" className="hover:text-primary">Facebook</a>
      </div>
    </div>
  </footer>
);
