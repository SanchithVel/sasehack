export type Category = "main" | "side" | "bread" | "fresh" | "dessert" | "drink";
export type Unit = "lbs" | "servings" | "pieces" | "dozen" | "trays" | "gallons";

export type MenuItem = {
  id: string;
  name: string;
  category: Category;
  unit: Unit;
  /** What the owner usually preps per day, in `unit`. */
  usualPrep: number;
  /** Ingredient + labor cost to make one unit. */
  costPerUnit: number;
  /** What one unit sells for. */
  pricePerUnit: number;
  lbsPerUnit: number;
};

export type Profile = {
  name: string;
  ownerName: string;
  cuisine: string;
  city: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  hours: string;
  description: string;
};

/** One item's prep vs. sales for one day, entered by the owner. */
export type DailyRecord = {
  date: string; // YYYY-MM-DD
  itemId: string;
  prepared: number;
  sold: number;
  wasted: number;
};

/** Something on the calendar the owner expects to change traffic. */
export type LocalEvent = {
  id: string;
  date: string;
  name: string;
  /** Expected change in customers, e.g. 25 = +25%, -20 = -20%. */
  changePct: number;
};

export type SurplusPost = {
  id: string;
  createdAt: string;
  kind: "donate" | "compost";
  items: { name: string; quantity: number; unit: string }[];
  estLbs: number;
  pickupBy: string;
  status: "open" | "claimed";
  claimedBy?: string;
};

export type WebsiteDraft = { html: string; notes: string; createdAt: string };

export type Db = {
  /** True while the app is showing generated demo data. */
  isDemo: boolean;
  profile: Profile;
  menu: MenuItem[];
  records: DailyRecord[];
  events: LocalEvent[];
  surplus: SurplusPost[];
  website: WebsiteDraft | null;
};

export type PartnerType = "food_bank" | "shelter" | "pantry" | "farm" | "compost" | "supplier";

export type Partner = {
  id: string;
  name: string;
  type: PartnerType;
  city: string;
  lat: number;
  lng: number;
  description: string;
  offers: string;
  rating?: number;
  reviews?: number;
  sample?: boolean; // true = made-up demo data
};
