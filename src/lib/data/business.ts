import type { MenuItem } from "@/lib/types";

export const APP_NAME = "PlateShare OK";

export const BUSINESS = {
  name: "Maria's Tacos",
  city: "Oklahoma City, OK",
  lat: 35.4676,
  lng: -97.5164,
};

export const MENU: MenuItem[] = [
  { id: "carne-asada", name: "Carne asada", category: "protein", unit: "lbs", usualPrep: 30, costPerUnit: 7.5, lbsPerUnit: 1 },
  { id: "al-pastor", name: "Al pastor", category: "protein", unit: "lbs", usualPrep: 25, costPerUnit: 5.0, lbsPerUnit: 1 },
  { id: "chicken-tinga", name: "Chicken tinga", category: "protein", unit: "lbs", usualPrep: 20, costPerUnit: 3.5, lbsPerUnit: 1 },
  { id: "rice", name: "Mexican rice", category: "side", unit: "lbs", usualPrep: 25, costPerUnit: 0.9, lbsPerUnit: 1 },
  { id: "beans", name: "Refried beans", category: "side", unit: "lbs", usualPrep: 20, costPerUnit: 1.1, lbsPerUnit: 1 },
  { id: "tortillas", name: "Corn tortillas", category: "bread", unit: "dozen", usualPrep: 40, costPerUnit: 1.5, lbsPerUnit: 1.1 },
  { id: "pico", name: "Pico de gallo", category: "fresh", unit: "lbs", usualPrep: 10, costPerUnit: 2.2, lbsPerUnit: 1 },
  { id: "guac", name: "Guacamole", category: "fresh", unit: "lbs", usualPrep: 8, costPerUnit: 6.0, lbsPerUnit: 1 },
];

export const menuItem = (id: string) => MENU.find((m) => m.id === id);
