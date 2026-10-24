"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { PARTNER_LABELS } from "@/lib/data/partners";
import type { Partner } from "@/lib/types";

export const PARTNER_COLORS: Record<Partner["type"], string> = {
  food_bank: "#16a34a",
  shelter: "#2563eb",
  pantry: "#0891b2",
  farm: "#ca8a04",
  compost: "#92400e",
  supplier: "#9333ea",
};

type Props = { center: { lat: number; lng: number; name: string }; partners: Partner[] };

// Leaflet touches `window`, so load this with next/dynamic and ssr: false.
export default function PartnerMap({ center, partners }: Props) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={8} scrollWheelZoom={false} className="z-0 h-80 w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={[center.lat, center.lng]} radius={10} pathOptions={{ color: "#dc2626", fillOpacity: 0.9 }}>
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
