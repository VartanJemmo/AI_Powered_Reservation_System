// Mock orders store — saves what each guest selected (food, drinks, desserts)
export type MenuCategory = "food" | "drinks" | "desserts";

export type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  category: MenuCategory;
};

export type OrderItem = {
  itemId: string;
  name: string;
  price: number;
  category: MenuCategory;
  qty: number;
};

export type GuestOrder = {
  id: string;
  guestEmail: string; // identifier for the guest profile
  guestName: string;
  guestPhone?: string;
  items: OrderItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "mayrig.orders.v1";

export const MENU: MenuItem[] = [
  // Food
  { id: "f1", name: "Mezze of the House", desc: "Hummus, muhammara, baba ganoush, lavash", price: 28, category: "food" },
  { id: "f2", name: "Lamb Kebab Skewers", desc: "Charcoal-grilled, sumac onion, fresh lavash", price: 36, category: "food" },
  { id: "f3", name: "Mante Dumplings", desc: "Hand-folded beef dumplings, garlic yogurt, sumac", price: 24, category: "food" },
  { id: "f4", name: "Su Boereg", desc: "Layered cheese pastry, parsley, nigella", price: 18, category: "food" },
  { id: "f5", name: "Soujouk Skillet", desc: "Spiced Armenian sausage, eggs, peppers", price: 22, category: "food" },
  // Drinks
  { id: "d1", name: "Armenian Coffee", desc: "Cardamom-scented, served with loukoum", price: 6, category: "drinks" },
  { id: "d2", name: "Areni Red Wine", desc: "Glass · Vayots Dzor highlands", price: 14, category: "drinks" },
  { id: "d3", name: "Pomegranate Spritz", desc: "Fresh pomegranate, soda, mint", price: 10, category: "drinks" },
  { id: "d4", name: "Tahn", desc: "Chilled yogurt drink, sea salt, mint", price: 5, category: "drinks" },
  // Desserts
  { id: "ds1", name: "Pistachio Baklava", desc: "Layered phyllo, rosewater syrup, gold leaf", price: 14, category: "desserts" },
  { id: "ds2", name: "Kadayif", desc: "Shredded phyllo, walnuts, orange blossom", price: 12, category: "desserts" },
  { id: "ds3", name: "Rose Loukoum", desc: "Trio of Turkish delight, powdered sugar", price: 8, category: "desserts" },
];

function loadAll(): GuestOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as GuestOrder[]) : [];
  } catch {
    return [];
  }
}

function saveAll(list: GuestOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getOrderForGuest(email: string): GuestOrder | undefined {
  if (!email) return undefined;
  return loadAll().find((o) => o.guestEmail.toLowerCase() === email.toLowerCase());
}

export function getAllOrders(): GuestOrder[] {
  return loadAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveGuestOrder(input: {
  guestEmail: string;
  guestName: string;
  guestPhone?: string;
  items: OrderItem[];
}): GuestOrder {
  const all = loadAll();
  const total = input.items.reduce((s, it) => s + it.price * it.qty, 0);
  const now = new Date().toISOString();
  const existingIdx = all.findIndex(
    (o) => o.guestEmail.toLowerCase() === input.guestEmail.toLowerCase()
  );
  if (existingIdx >= 0) {
    const updated: GuestOrder = {
      ...all[existingIdx],
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      items: input.items,
      total,
      updatedAt: now,
    };
    all[existingIdx] = updated;
    saveAll(all);
    return updated;
  }
  const created: GuestOrder = {
    id: crypto.randomUUID(),
    guestEmail: input.guestEmail,
    guestName: input.guestName,
    guestPhone: input.guestPhone,
    items: input.items,
    total,
    createdAt: now,
    updatedAt: now,
  };
  all.push(created);
  saveAll(all);
  return created;
}

export function clearGuestOrder(email: string) {
  const all = loadAll().filter((o) => o.guestEmail.toLowerCase() !== email.toLowerCase());
  saveAll(all);
}

export function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}
