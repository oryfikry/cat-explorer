"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { ICat } from "@/models/Cat";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CatMap from "./components/CatMap";
import { useParams } from "next/navigation";

// Mock cat in case API fails
const mockCat: ICat & { _id: string } = {
  _id: "mock1",
  name: "Whiskers",
  image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=800",
  description: "Friendly orange tabby cat seen near the park. Very sociable and loves to be petted. Appears to be well-fed and healthy, but doesn't have a collar.",
  location: {
    coordinates: [-73.9857, 40.7484] as [number, number], // New York
    address: "Central Park, New York",
  },
  tags: ["orange", "friendly", "tabby"],
  userId: "user1",
  createdAt: new Date("2024-03-01"),
  updatedAt: new Date("2024-03-01"),
};

export default function CatDetailsPage() {
  const params = useParams<{ id: string }>();
  const [cat, setCat] = useState<(ICat & { _id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCat = async () => {
      if (!params.id) {
        setError("No cat ID provided");
        setIsLoading(false);
        return;
      }

      // If ID starts with "mock", use mock data
      if (params.id.startsWith("mock")) {
        setCat({...mockCat, _id: params.id});
        setIsLoading(false);
        return;
      }

      try {
        // Fetch cat data from API
        const response = await fetch(`/api/cats/${params.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Cat not found");
          } else {
            throw new Error(`Error fetching cat: ${response.statusText}`);
          }
        }
        
        const catData = await response.json();
        
        // Format dates from strings to Date objects
        if (catData.createdAt) {
          catData.createdAt = new Date(catData.createdAt);
        }
        if (catData.updatedAt) {
          catData.updatedAt = new Date(catData.updatedAt);
        }
        
        setCat(catData);
      } catch (error) {
        console.error("Error fetching cat:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        
        // Use mock data as fallback for demonstration purposes
        if (process.env.NODE_ENV === 'development') {
          console.log("Using mock data as fallback");
          setCat({...mockCat, _id: params.id});
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCat();
  }, [params.id]);

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-10 text-center">
          <p>Loading cat details...</p>
        </div>
      </div>
    );
  }

  if (error || !cat) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-10 text-center">
          <h1 className="text-3xl font-bold mb-4">Cat Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || "Sorry, we couldn't find the cat you're looking for."}
          </p>
          <Button href="/explore">
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="mb-6">
          <Link href="/explore" className="text-blue-600 hover:underline flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Explore
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            <div className="md:w-1/2">
              <div className="relative h-80 md:h-full w-full">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover"
                  unoptimized={cat.image.startsWith('data:')} // Skip optimization for data URLs
                />
              </div>
            </div>
            
            <div className="p-6 md:w-1/2">
              <h1 className="text-3xl font-bold mb-2">{cat.name}</h1>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Added on {cat.createdAt?.toLocaleDateString() || 'Unknown date'}
                </p>
              </div>
              
              {cat.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Description</h2>
                  <p className="text-gray-700">{cat.description}</p>
                </div>
              )}
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Location</h2>
                <p className="text-gray-700">
                  {cat.location.address || `${cat.location.coordinates[1]}, ${cat.location.coordinates[0]}`}
                </p>
              </div>
              
              {cat.tags && cat.tags.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {cat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 flex gap-4">
                <Button variant="outline" href={`/map?highlight=${cat._id}`}>
                  View on Map
                </Button>
                <Button>Report Issue</Button>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Location on Map</h2>
            <div className="h-[300px] rounded-lg overflow-hidden">
              <CatMap cat={cat} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 