import type { Category, Unit } from "@/lib/types";

export const APP_NAME = "PlateShare";

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "main", label: "Main / protein" },
  { value: "side", label: "Side" },
  { value: "bread", label: "Bread / tortillas" },
  { value: "fresh", label: "Fresh / salads / salsas" },
  { value: "dessert", label: "Dessert / bakery" },
  { value: "drink", label: "Drink" },
];

export const UNITS: Unit[] = ["lbs", "servings", "pieces", "dozen", "trays", "gallons"];

/** Sensible starting weight per unit when the owner adds a menu item. */
export const DEFAULT_LBS_PER_UNIT: Record<Unit, number> = {
  lbs: 1,
  servings: 0.75,
  pieces: 0.25,
  dozen: 1.1,
  trays: 9,
  gallons: 8.3,
};

export const OK_CITIES = [
  { name: "Oklahoma City", lat: 35.4676, lng: -97.5164 },
  { name: "Tulsa", lat: 36.154, lng: -95.9928 },
  { name: "Norman", lat: 35.2226, lng: -97.4395 },
  { name: "Edmond", lat: 35.6528, lng: -97.4781 },
  { name: "Broken Arrow", lat: 36.0526, lng: -95.7908 },
  { name: "Moore", lat: 35.3395, lng: -97.4867 },
  { name: "Midwest City", lat: 35.4495, lng: -97.3967 },
  { name: "Lawton", lat: 34.6036, lng: -98.3959 },
  { name: "Stillwater", lat: 36.1156, lng: -97.0584 },
  { name: "Enid", lat: 36.3956, lng: -97.8784 },
];
