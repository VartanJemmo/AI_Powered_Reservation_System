import { useEffect, useState } from "react";

export const StickyReserveBar = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById("reserve");
      const past = window.scrollY > 400;
      const inView = el ? el.getBoundingClientRect().top < window.innerHeight - 80 : false;
      setShow(past && !inView);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scroll = () => document.getElementById("reserve")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-3 safe-bottom transition-all duration-300 ${
        show ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="rounded-2xl border border-primary/40 bg-background/90 backdrop-blur-xl shadow-elev p-3 flex items-center gap-3">
        <div className="flex-1 pl-2">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Tonight</p>
          <p className="text-sm">A few spots left at <span className="text-primary">20:00</span></p>
        </div>
        <button
          onClick={scroll}
          className="rounded-full bg-gradient-gold text-primary-foreground px-5 py-3 text-xs uppercase tracking-widest font-medium shadow-gold"
        >
          Reserve
        </button>
      </div>
    </div>
  );
};
