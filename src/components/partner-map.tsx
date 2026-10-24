"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
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

// Leaflet touches `window`, so load this with next/dynamic and ssr: false.
export default function PartnerMap({ center, partners }: Props) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={8} scrollWheelZoom={false} className="z-0 h-72 w-full rounded-lg">
      {/* Free OSM tiles, darkened in CSS (.map-tiles-dark) to match the theme — no API key needed. */}
      <TileLayer
        className="map-tiles-dark"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={[center.lat, center.lng]} radius={10} pathOptions={{ color: "#f87171", fillOpacity: 0.9 }}>
        <Popup>{center.name || "Your business"} (you)</Popup>
      </CircleMarker>
      {partners.map((p) => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={8} pathOptions={{ color: PARTNER_COLORS[p.type], fillOpacity: 0.8 }}>
          <Popup>
            <strong>{p.name}</strong>
            <br />
            {PARTNER_LABELS[p.type]} · {p.city}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
