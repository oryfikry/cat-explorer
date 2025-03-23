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

export default function CatMap() {
  const [cats, setCats] = useState<any[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [catsError, setCatsError] = useState<string | null>(null);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>([0, 0]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Fetch cats from API
  useEffect(() => {
    const fetchCats = async () => {
      setIsLoadingCats(true);
      setCatsError(null);
      
      try {
        let url = '/api/cats';
        
        // Add location parameters if user location is available
        if (userLocation) {
          url += `?lat=${userLocation[0]}&lng=${userLocation[1]}&distance=50`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch cats');
        }
        
        const data = await response.json();
        
        // If we have no real data or very few cats, add some mock ones
        if (data.length < 3) {
          const mockCats = [
            {
              _id: "mock1",
              name: "Whiskers",
              image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800",
              description: "Friendly orange tabby cat seen near the park",
              location: {
                coordinates: [-73.9857, 40.7484] as [number, number], // New York
                address: "Central Park, New York",
              },
              tags: ["orange", "friendly", "tabby"],
              userId: "mockuser1",
              createdAt: new Date("2024-03-01"),
              updatedAt: new Date("2024-03-01"),
            },
            {
              _id: "mock2",
              name: "Shadow",
              image: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=800",
              description: "Black cat that hangs out near the coffee shop",
              location: {
                coordinates: [-118.2437, 34.0522] as [number, number], // Los Angeles
                address: "Downtown, Los Angeles",
              },
              tags: ["black", "shy"],
              userId: "mockuser2",
              createdAt: new Date("2024-03-05"),
              updatedAt: new Date("2024-03-05"),
            },
            {
              _id: "mock3",
              name: "Mittens",
              image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800",
              description: "Calico cat with white paws",
              location: {
                coordinates: [-0.1278, 51.5074] as [number, number], // London
                address: "Covent Garden, London",
              },
              tags: ["calico", "playful"],
              userId: "mockuser3",
              createdAt: new Date("2024-03-10"),
              updatedAt: new Date("2024-03-10"),
            },
            {
              _id: "mock4",
              name: "Bella",
              image: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?q=80&w=800",
              description: "Beautiful tabby who likes to sit on window sills",
              location: {
                coordinates: [139.6917, 35.6895] as [number, number], // Tokyo
                address: "Shibuya, Tokyo",
              },
              tags: ["tabby", "friendly", "window-watcher"],
              userId: "mockuser4",
              createdAt: new Date("2024-03-15"),
              updatedAt: new Date("2024-03-15"),
            },
            {
              _id: "mock5",
              name: "Leo",
              image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800",
              description: "Ginger cat with a distinctive lion-like mane",
              location: {
                coordinates: [2.3522, 48.8566] as [number, number], // Paris
                address: "Near Eiffel Tower, Paris",
              },
              tags: ["ginger", "fluffy", "majestic"],
              userId: "mockuser5",
              createdAt: new Date("2024-03-20"),
              updatedAt: new Date("2024-03-20"),
            }
          ];
          
          // Combine real data with mock data
          setCats([...data, ...mockCats]);
        } else {
          setCats(data);
        }
      } catch (error) {
        console.error('Error fetching cats:', error);
        setCatsError('Failed to load cats from API. Showing mock data instead.');
        
        // If API fails, show mock data
        const mockCats = [
          {
            _id: "mock1",
            name: "Whiskers",
            image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800",
            description: "Friendly orange tabby cat seen near the park",
            location: {
              coordinates: [-73.9857, 40.7484] as [number, number], // New York
              address: "Central Park, New York",
            },
            tags: ["orange", "friendly", "tabby"],
            userId: "mockuser1",
            createdAt: new Date("2024-03-01"),
            updatedAt: new Date("2024-03-01"),
          },
          {
            _id: "mock2",
            name: "Shadow",
            image: "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=800",
            description: "Black cat that hangs out near the coffee shop",
            location: {
              coordinates: [-118.2437, 34.0522] as [number, number], // Los Angeles
              address: "Downtown, Los Angeles",
            },
            tags: ["black", "shy"],
            userId: "mockuser2",
            createdAt: new Date("2024-03-05"),
            updatedAt: new Date("2024-03-05"),
          },
          {
            _id: "mock3",
            name: "Mittens",
            image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=800",
            description: "Calico cat with white paws",
            location: {
              coordinates: [-0.1278, 51.5074] as [number, number], // London
              address: "Covent Garden, London",
            },
            tags: ["calico", "playful"],
            userId: "mockuser3",
            createdAt: new Date("2024-03-10"),
            updatedAt: new Date("2024-03-10"),
          },
          {
            _id: "mock4",
            name: "Bella",
            image: "https://images.unsplash.com/photo-1529778873920-4da4926a72c2?q=80&w=800",
            description: "Beautiful tabby who likes to sit on window sills",
            location: {
              coordinates: [139.6917, 35.6895] as [number, number], // Tokyo
              address: "Shibuya, Tokyo",
            },
            tags: ["tabby", "friendly", "window-watcher"],
            userId: "mockuser4",
            createdAt: new Date("2024-03-15"),
            updatedAt: new Date("2024-03-15"),
          },
          {
            _id: "mock5",
            name: "Leo",
            image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800",
            description: "Ginger cat with a distinctive lion-like mane",
            location: {
              coordinates: [2.3522, 48.8566] as [number, number], // Paris
              address: "Near Eiffel Tower, Paris",
            },
            tags: ["ginger", "fluffy", "majestic"],
            userId: "mockuser5",
            createdAt: new Date("2024-03-20"),
            updatedAt: new Date("2024-03-20"),
          }
        ];
        
        setCats(mockCats);
      } finally {
        setIsLoadingCats(false);
      }
    };
    
    // Only fetch cats after we have determined user location (or failed to)
    if (!isLoading) {
      fetchCats();
    }
  }, [userLocation, isLoading]);

  // Get user location
  useEffect(() => {
    // Set up timeout for geolocation
    const locationTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Geolocation timed out after 10 seconds");
        setLocationError("Location request timed out. Default location will be used.");
        setDefaultCenter([20, 0]); // World view
        setIsLoading(false);
      }
    }, 10000); // 10 seconds timeout
    
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(locationTimeout);
          const userPos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(userPos);
          setDefaultCenter(userPos);
          setIsLoading(false);
          setLocationError(null);
        },
        (error) => {
          clearTimeout(locationTimeout);
          console.error("Error getting location:", error);
          // Set a specific error message for secure context errors
          if (error.code === 1 && error.message.includes("secure origins")) {
            setLocationError("Geolocation requires HTTPS. Your location will not be used.");
          } else if (error.code === 3) {
            setLocationError("Location request timed out. Default location will be used.");
          } else {
            setLocationError(`Unable to get your location: ${error.message}`);
          }
          // Default to center that shows all markers
          setDefaultCenter([20, 0]);
          setIsLoading(false);
        },
        { 
          timeout: 10000,  // 10 seconds timeout
          enableHighAccuracy: false, 
          maximumAge: 60000 // Accept positions up to 1 minute old
        }
      );
    } else {
      clearTimeout(locationTimeout);
      console.error("Geolocation is not supported by this browser.");
      setLocationError("Geolocation is not supported by your browser.");
      setDefaultCenter([20, 0]);
      setIsLoading(false);
    }
    
    // Clean up timeout if component unmounts
    return () => clearTimeout(locationTimeout);
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
      
      {catsError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error:</p>
          <p>{catsError}</p>
        </div>
      )}
      
      {isLoadingCats && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
          Loading cats...
        </div>
      )}
      
      {!isLoadingCats && cats.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded mb-4">
          No cats found. Try adding some!
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

        {/* Cat markers with image previews */}
        {cats.map((cat) => (
          <Marker
            key={cat._id}
            position={[cat.location.coordinates[1], cat.location.coordinates[0]]}
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