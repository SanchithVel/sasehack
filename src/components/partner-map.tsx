"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { PARTNER_LABELS } from "@/lib/data/partners";
import type { Partner } from "@/lib/types";

export const PARTNER_COLORS: Record<Partner["type"], string> = {
  food_bank: "#4ade80",
  shelter: "#60a5fa",
  pantry: "#22d3ee",
  farm: "#facc15",
  compost: "#d97706",
  supplier: "#c084fc",
};

type Props = { center: { lat: number; lng: number; name: string }; partners: Partner[] };

/** Popup content built as DOM nodes, so names are never parsed as HTML. */
function popup(title: string, subtitle?: string) {
  const el = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = title;
  el.append(strong);
  if (subtitle) el.append(document.createElement("br"), subtitle);
  return el;
}

// We drive Leaflet directly instead of using react-leaflet: React re-runs effects
// (Strict Mode in dev, and Next.js hiding/showing visited pages), and react-leaflet
// then adds layers to a map it already removed ("this.getPane() is undefined").
// Here every effect run builds a fresh map and its cleanup removes it.
// Leaflet touches `window`, so load this with next/dynamic and ssr: false.
export default function PartnerMap({ center, partners }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const markers = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const map = L.map(container.current!, { center: [center.lat, center.lng], zoom: 8, scrollWheelZoom: false });
    // Free OSM tiles, darkened in CSS (.map-tiles-dark) to match the theme — no API key needed.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      className: "map-tiles-dark",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.circleMarker([center.lat, center.lng], { radius: 10, color: "#f87171", fillOpacity: 0.9 })
      .bindPopup(popup(`${center.name || "Your business"} (you)`))
      .addTo(map);
    markers.current = L.layerGroup().addTo(map);
    return () => {
      markers.current = null;
      map.remove();
    };
  }, [center.lat, center.lng, center.name]);

  // Runs after the map effect above (same order on every run), so the layer group exists.
  useEffect(() => {
    const group = markers.current;
    if (!group) return;
    group.clearLayers();
    for (const p of partners) {
      L.circleMarker([p.lat, p.lng], { radius: 8, color: PARTNER_COLORS[p.type], fillOpacity: 0.8 })
        .bindPopup(popup(p.name, `${PARTNER_LABELS[p.type]} · ${p.city}`))
        .addTo(group);
    }
  }, [partners, center.lat, center.lng, center.name]);

  return <div ref={container} className="z-0 h-72 w-full rounded-lg" />;
}
