// Mock orders store — saves what each guest selected (food, drinks, desserts)
import cocktailNegroni from "@/assets/cocktail-negroni.jpg";
import cocktailMojito from "@/assets/cocktail-mojito.jpg";
import cocktailEspressoMartini from "@/assets/cocktail-espresso-martini.jpg";
import cocktailPomegranateSpritz from "@/assets/cocktail-pomegranate-spritz.jpg";
import cocktailOldFashioned from "@/assets/cocktail-old-fashioned.jpg";

export type MenuCategory = "food" | "drinks" | "desserts";

export type MenuItem = {
  id: string;
  name: string;
  desc: string;
  price: number;
  category: MenuCategory;
  image?: string;
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
  // Cocktails (international)
  { id: "d1", name: "Negroni", desc: "Italian classic · gin, Campari, sweet vermouth, orange peel", price: 16, category: "drinks", image: cocktailNegroni },
  { id: "d2", name: "Mojito", desc: "Cuban highball · white rum, lime, mint, soda", price: 14, category: "drinks", image: cocktailMojito },
  { id: "d3", name: "Espresso Martini", desc: "Vodka, fresh espresso, coffee liqueur, velvet foam", price: 17, category: "drinks", image: cocktailEspressoMartini },
  { id: "d4", name: "Pomegranate Spritz", desc: "House signature · pomegranate, prosecco, mint", price: 15, category: "drinks", image: cocktailPomegranateSpritz },
  { id: "d5", name: "Old Fashioned", desc: "American classic · bourbon, bitters, orange, sugar", price: 18, category: "drinks", image: cocktailOldFashioned },
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
