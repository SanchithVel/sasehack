export type Category = "protein" | "side" | "bread" | "fresh";

export type MenuItem = {
  id: string;
  name: string;
  category: Category;
  unit: "lbs" | "dozen";
  /** What the owner usually preps per day, in `unit`. */
  usualPrep: number;
  costPerUnit: number;
  lbsPerUnit: number;
};

/** One item's prep vs. sales for one day. */
export type DailyRecord = {
  date: string; // YYYY-MM-DD
  itemId: string;
  prepared: number;
  sold: number;
  wasted: number;
};

/** A waste entry logged today (e.g. from a photo). */
export type WasteLog = {
  id: string;
  date: string;
  name: string;
  quantity: number;
  unit: string;
  estLbs: number;
  itemId: string | null;
  source: "photo" | "manual";
};

export type PartnerType =
  | "food_bank"
  | "shelter"
  | "pantry"
  | "farm"
  | "compost"
  | "supplier";

export type Partner = {
  id: string;
  name: string;
  type: PartnerType;
  city: string;
  lat: number;
  lng: number;
  description: string;
  accepts: string[];
  rating?: number;
  sample?: boolean; // true = made-up demo data
};

export type SurplusPost = {
  id: string;
  createdAt: string;
  items: { name: string; quantity: number; unit: string }[];
  estLbs: number;
  pickupBy: string;
  status: "open" | "claimed";
  claimedBy?: string;
};

export type LocalEvent = {
  date: string;
  name: string;
  /** Demand multiplier per menu category, e.g. { protein: 1.3 }. */
  multipliers: Partial<Record<Category, number>>;
};
