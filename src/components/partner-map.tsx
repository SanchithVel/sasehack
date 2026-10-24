"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { BUSINESS } from "@/lib/data/business";
import { PARTNER_LABELS } from "@/lib/data/partners";
import type { Partner } from "@/lib/types";

const COLORS: Record<Partner["type"], string> = {
  food_bank: "#16a34a",
  shelter: "#2563eb",
  pantry: "#0891b2",
  farm: "#ca8a04",
  compost: "#92400e",
  supplier: "#9333ea",
};

// Leaflet touches `window`, so load this with next/dynamic and ssr: false.
export default function PartnerMap({ partners }: { partners: Partner[] }) {
  return (
    <MapContainer center={[BUSINESS.lat, BUSINESS.lng]} zoom={9} scrollWheelZoom={false} className="h-80 w-full rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <CircleMarker center={[BUSINESS.lat, BUSINESS.lng]} radius={10} pathOptions={{ color: "#dc2626", fillOpacity: 0.9 }}>
        <Popup>{BUSINESS.name} (you)</Popup>
      </CircleMarker>
      {partners.map((p) => (
        <CircleMarker key={p.id} center={[p.lat, p.lng]} radius={8} pathOptions={{ color: COLORS[p.type], fillOpacity: 0.8 }}>
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
