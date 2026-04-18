import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  MENU,
  type MenuCategory,
  type OrderItem,
  formatPrice,
  getOrderForGuest,
  saveGuestOrder,
  clearGuestOrder,
} from "@/lib/orders";
import { toast } from "sonner";

const TABS: { key: MenuCategory; label: string }[] = [
  { key: "food", label: "Food" },
  { key: "drinks", label: "Drinks" },
  { key: "desserts", label: "Desserts" },
];

export const OrderBuilder = () => {
  const { user } = useAuth();
  const [active, setActive] = useState<MenuCategory>("food");
  const [cart, setCart] = useState<Record<string, number>>({});
  const guestKey = user?.email || user?.phone || "";

  // Load existing saved order for this guest
  useEffect(() => {
    if (!guestKey) return;
    const existing = getOrderForGuest(guestKey);
    if (existing) {
      const map: Record<string, number> = {};
      for (const it of existing.items) map[it.itemId] = it.qty;
      setCart(map);
    }
  }, [guestKey]);

  const items = useMemo(() => MENU.filter((m) => m.category === active), [active]);

  const totals = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const m of MENU) {
      const q = cart[m.id] ?? 0;
      if (q > 0) {
        count += q;
        total += q * m.price;
      }
    }
    return { count, total };
  }, [cart]);

  const inc = (id: string) => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
  const dec = (id: string) =>
    setCart((c) => {
      const next = { ...c };
      const v = (next[id] ?? 0) - 1;
      if (v <= 0) delete next[id];
      else next[id] = v;
      return next;
    });

  const handleSave = () => {
    if (!user || user.role !== "guest") {
      toast.error("Sign in as a guest to save your order.");
      return;
    }
    if (!guestKey) {
      toast.error("We need your email or phone to save your order.");
      return;
    }
    if (totals.count === 0) {
      toast.error("Add at least one item before saving.");
      return;
    }
    const orderItems: OrderItem[] = MENU.filter((m) => (cart[m.id] ?? 0) > 0).map((m) => ({
      itemId: m.id,
      name: m.name,
      price: m.price,
      category: m.category,
      qty: cart[m.id],
    }));
    saveGuestOrder({
      guestEmail: guestKey,
      guestName: user.name ?? "Guest",
      guestPhone: user.phone,
      items: orderItems,
    });
    toast.success("Your order has been saved to your profile.");
  };

  const handleClear = () => {
    setCart({});
    if (guestKey) clearGuestOrder(guestKey);
    toast("Order cleared.");
  };

  return (
    <section id="order" className="relative py-24 sm:py-32">
      <div className="container-narrow">
        <div className="text-center max-w-2xl mx-auto">
          <span className="eyebrow justify-center">
            <span className="gold-divider" /> Pre-order
          </span>
          <h2 className="mt-4 font-display text-4xl sm:text-5xl">Build your table</h2>
          <p className="mt-4 text-muted-foreground">
            Save your selection of food, drinks and desserts to your profile. We'll have it ready when you arrive.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-8">
          {/* Menu */}
          <div>
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`text-sm rounded-full px-4 py-2 border transition-colors ${
                    active === t.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              {items.map((m) => {
                const qty = cart[m.id] ?? 0;
                return (
                  <article
                    key={m.id}
                    className={`glass-card p-5 transition-colors ${
                      qty > 0 ? "border-primary/50" : "hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-lg">{m.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{m.desc}</p>
                      </div>
                      <span className="text-primary font-medium whitespace-nowrap">
                        {formatPrice(m.price)}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {qty > 0 ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => dec(m.id)}
                            className="h-8 w-8 rounded-full border border-border hover:border-primary/40"
                            aria-label="Decrease"
                          >
                            −
                          </button>
                          <span className="font-medium w-6 text-center">{qty}</span>
                          <button
                            onClick={() => inc(m.id)}
                            className="h-8 w-8 rounded-full border border-border hover:border-primary/40"
                            aria-label="Increase"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground uppercase tracking-widest">
                          Tap to add
                        </span>
                      )}
                      {qty === 0 && (
                        <button
                          onClick={() => inc(m.id)}
                          className="text-xs rounded-full bg-gradient-gold text-primary-foreground px-3 py-1.5 uppercase tracking-widest font-medium shadow-gold"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Cart summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="glass-card p-6">
              <h3 className="font-display text-xl">Your order</h3>
              {user?.role === "guest" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Saving to {user.name?.split(" ")[0] ?? "your profile"}
                </p>
              )}
              {!user || user.role !== "guest" ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Sign in as a guest to save your order.
                </p>
              ) : null}

              <div className="mt-5 divide-y divide-border/60 max-h-[360px] overflow-y-auto">
                {totals.count === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    Nothing added yet.
                  </p>
                )}
                {MENU.filter((m) => (cart[m.id] ?? 0) > 0).map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate">{m.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {m.category} · {formatPrice(m.price)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => dec(m.id)}
                        className="h-7 w-7 rounded-full border border-border text-xs hover:border-primary/40"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm">{cart[m.id]}</span>
                      <button
                        onClick={() => inc(m.id)}
                        className="h-7 w-7 rounded-full border border-border text-xs hover:border-primary/40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {totals.count} {totals.count === 1 ? "item" : "items"}
                </span>
                <span className="font-display text-2xl gold-text">{formatPrice(totals.total)}</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  onClick={handleClear}
                  className="rounded-full border border-border py-2.5 text-xs uppercase tracking-widest hover:border-destructive/40 hover:text-destructive transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleSave}
                  className="rounded-full bg-gradient-gold text-primary-foreground py-2.5 text-xs uppercase tracking-widest font-medium shadow-gold"
                >
                  Save order
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};
