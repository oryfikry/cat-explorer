"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ICat } from "@/models/Cat";

// Custom icon for the cat marker
const catIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface CatMapProps {
  cat: ICat & { _id: string };
}

export default function CatMap({ cat }: CatMapProps) {
  // Set default position as the cat's coordinates
  const [position, setPosition] = useState<[number, number]>([
    cat.location.coordinates[1], 
    cat.location.coordinates[0]
  ]);

  return (
    <MapContainer 
      center={position} 
      zoom={14} 
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <Marker position={position} icon={catIcon}>
        <Popup>
          <div className="text-center">
            <strong>{cat.name}</strong>
            {cat.location.address && (
              <p className="text-xs mt-1">{cat.location.address}</p>
            )}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
} 