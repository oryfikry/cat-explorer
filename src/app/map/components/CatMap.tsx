"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ICat } from "@/models/Cat";

// Fix for marker icons in Leaflet with Next.js
// This is necessary due to how Next.js handles static assets
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Same mock data as in CatList
const mockCats: (ICat & { _id: string })[] = [
  {
    _id: "1",
    name: "Whiskers",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800",
    description: "Friendly orange tabby cat seen near the park",
    location: {
      coordinates: [-73.9857, 40.7484] as [number, number], // New York
      address: "Central Park, New York",
    },
    tags: ["orange", "friendly", "tabby"],
    userId: "user1",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    _id: "2",
    name: "Shadow",
    image: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=800",
    description: "Black cat that hangs out near the coffee shop",
    location: {
      coordinates: [-118.2437, 34.0522] as [number, number], // Los Angeles
      address: "Downtown, Los Angeles",
    },
    tags: ["black", "shy"],
    userId: "user2",
    createdAt: new Date("2024-03-05"),
    updatedAt: new Date("2024-03-05"),
  },
  {
    _id: "3",
    name: "Mittens",
    image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800",
    description: "Calico cat with white paws",
    location: {
      coordinates: [-0.1278, 51.5074] as [number, number], // London
      address: "Covent Garden, London",
    },
    tags: ["calico", "playful"],
    userId: "user3",
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-10"),
  },
];

export default function CatMap() {
  const [cats] = useState(mockCats);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>([0, 0]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userPos);
          setDefaultCenter(userPos);
          setIsLoading(false);
          setLocationError(null);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Set a specific error message for secure context errors
          if (error.code === 1 && error.message.includes("secure origins")) {
            setLocationError("Geolocation requires HTTPS. Your location will not be used.");
          } else {
            setLocationError(`Unable to get your location: ${error.message}`);
          }
          // Default to center that shows all markers
          setDefaultCenter([20, 0]);
          setIsLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setLocationError("Geolocation is not supported by your browser.");
      setDefaultCenter([20, 0]);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        Getting your location...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)]">
      {locationError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
          <p className="font-medium">Location Issue:</p>
          <p>{locationError}</p>
        </div>
      )}
      
      <MapContainer
        center={[defaultCenter[0], defaultCenter[1]]}
        zoom={3}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation[0], userLocation[1]]}
            icon={
              new L.Icon({
                iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                className: "blinking-marker", // We can add a CSS animation to make this blink
              })
            }
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Cat markers */}
        {cats.map((cat) => (
          <Marker
            key={cat._id}
            position={[cat.location.coordinates[1], cat.location.coordinates[0]]}
            icon={customIcon}
          >
            <Popup>
              <div className="max-w-[250px]">
                <h3 className="font-medium text-lg">{cat.name}</h3>
                {cat.description && <p className="text-sm mt-1">{cat.description}</p>}
                {cat.location.address && (
                  <p className="text-xs mt-2 text-gray-500">📍 {cat.location.address}</p>
                )}
                <Link href={`/cats/${cat._id}`} className="block mt-3">
                  <Button size="sm" className="w-full">View Details</Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
} 