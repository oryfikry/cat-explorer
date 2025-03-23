"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ICat } from "@/models/Cat";

// Fix for marker icons in Leaflet with Next.js
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create custom image marker icon
const createImageMarkerIcon = (imageUrl: string) => {
  // Create custom HTML for the marker
  const markerHtml = `
    <div class="cat-marker">
      <div class="cat-marker-image" style="background-image: url('${imageUrl}')"></div>
    </div>
  `;

  // Define the CSS for the markers inline with the component
  if (typeof document !== 'undefined' && !document.getElementById('cat-marker-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'cat-marker-styles';
    styleEl.innerHTML = `
      .cat-marker {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid white;
        box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      }
      .cat-marker-image {
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
      }
    `;
    document.head.appendChild(styleEl);
  }

  return L.divIcon({
    html: markerHtml,
    className: 'custom-marker',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -25]
  });
};

type CatMapProps = {
  cat: ICat & { _id: string };
};

export default function CatMap({ cat }: CatMapProps) {
  const position: [number, number] = useMemo(
    () => [
      cat.location.coordinates[1],
      cat.location.coordinates[0],
    ],
    [cat.location.coordinates]
  );

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={position} 
          icon={createImageMarkerIcon(cat.image)}
        >
          <Popup>
            <div className="max-w-[250px]">
              <h3 className="font-medium text-lg">{cat.name}</h3>
              <div className="my-2 w-full h-40 relative rounded overflow-hidden">
                <img 
                  src={cat.image} 
                  alt={cat.name}
                  className="object-cover w-full h-full"
                />
              </div>
              {cat.description && <p className="text-sm mt-1">{cat.description}</p>}
              {cat.location.address && (
                <p className="text-xs mt-2 text-gray-500">📍 {cat.location.address}</p>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
} 