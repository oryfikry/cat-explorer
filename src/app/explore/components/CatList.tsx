"use client";

import { useState, useEffect } from "react";
import CatCard from "@/components/cats/CatCard";
import { Button } from "@/components/ui/button";
import { ICat } from "@/models/Cat";

// This would be replaced with actual API data fetching
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

export default function CatList() {
  const [cats] = useState(mockCats);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
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
          setIsLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setLocationError("Geolocation is not supported by your browser.");
      setIsLoading(false);
    }
  }, []);

  // Calculate distance between two coordinates in kilometers using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  // Sort cats by distance if we have user location
  const sortedCats = userLocation
    ? [...cats].sort((a, b) => {
        const distA = calculateDistance(
          userLocation[1],
          userLocation[0],
          a.location.coordinates[1],
          a.location.coordinates[0]
        );
        const distB = calculateDistance(
          userLocation[1],
          userLocation[0],
          b.location.coordinates[1],
          b.location.coordinates[0]
        );
        return distA - distB;
      })
    : cats;

  if (isLoading) {
    return <div className="text-center py-10">Getting your location...</div>;
  }

  return (
    <div>
      {locationError ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
          <p className="text-sm text-yellow-700">
            {locationError}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              if (navigator.geolocation) {
                setIsLoading(true);
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setUserLocation([position.coords.longitude, position.coords.latitude]);
                    setLocationError(null);
                    setIsLoading(false);
                  },
                  (error) => {
                    console.error("Error getting location:", error);
                    if (error.code === 1 && error.message.includes("secure origins")) {
                      setLocationError("Geolocation requires HTTPS. Your location will not be used.");
                    } else {
                      setLocationError(`Unable to get your location: ${error.message}`);
                    }
                    setIsLoading(false);
                  },
                  { timeout: 10000, enableHighAccuracy: false, maximumAge: 0 }
                );
              }
            }}
          >
            Try Again
          </Button>
        </div>
      ) : userLocation ? (
        <p className="text-sm text-gray-500 mb-6">
          Showing cats sorted by distance from your current location
        </p>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md mb-6">
          <p className="text-sm text-yellow-700">
            Location services are disabled. Enable location to see cats near you.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              if (navigator.geolocation) {
                setIsLoading(true);
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    setUserLocation([position.coords.longitude, position.coords.latitude]);
                    setLocationError(null);
                    setIsLoading(false);
                  },
                  (error) => {
                    console.error("Error getting location:", error);
                    if (error.code === 1 && error.message.includes("secure origins")) {
                      setLocationError("Geolocation requires HTTPS. Your location will not be used.");
                    } else {
                      setLocationError(`Unable to get your location: ${error.message}`);
                    }
                    setIsLoading(false);
                  },
                  { timeout: 10000, enableHighAccuracy: false, maximumAge: 0 }
                );
              }
            }}
          >
            Enable Location
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCats.map((cat) => (
          <div key={cat._id}>
            <CatCard 
              cat={cat} 
              distance={
                userLocation 
                  ? calculateDistance(
                      userLocation[1], 
                      userLocation[0], 
                      cat.location.coordinates[1], 
                      cat.location.coordinates[0]
                    ) 
                  : undefined
              } 
            />
          </div>
        ))}
      </div>
    </div>
  );
} 