"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function NewCatForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  // Cat data
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  
  // Location handling
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  useEffect(() => {
    // Redirect if not logged in
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);
  
  const handleGetLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates([position.coords.longitude, position.coords.latitude]);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Failed to get your location. Please try again or enter the location manually.");
          setIsGettingLocation(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
      setIsGettingLocation(false);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setError("You must be logged in to add a cat.");
      return;
    }
    
    if (!name || !imageUrl || !coordinates) {
      setError("Please fill in all required fields and provide a location.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // In a real app, this would be an API call to save the cat data
      // For now, simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      
      // Reset form after successful submission
      setName("");
      setDescription("");
      setTags("");
      setImageUrl("");
      setAddress("");
      setCoordinates(null);
      
      // Redirect to explore page after a delay
      setTimeout(() => {
        router.push("/explore");
      }, 2000);
    } catch (err) {
      setError("Failed to add cat. Please try again.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (status === "loading") {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <h2 className="text-xl font-semibold text-green-800 mb-2">Cat Added Successfully!</h2>
        <p className="text-green-600 mb-4">Thank you for contributing to Cat Explorer.</p>
        <p className="text-green-600">Redirecting to explore page...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Cat Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Whiskers, Fluffy, etc."
            required
          />
        </div>
        
        {/* Image URL */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL *
          </label>
          <input
            type="url"
            id="image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/cat-image.jpg"
            required
          />
          
          {imageUrl && (
            <div className="mt-2 relative h-40 w-full overflow-hidden rounded-md">
              <Image 
                src={imageUrl} 
                alt="Cat preview" 
                fill
                className="object-cover"
                onError={() => setError("Invalid image URL. Please provide a valid URL.")}
              />
            </div>
          )}
        </div>
        
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe the cat (appearance, behavior, etc.)"
          />
        </div>
        
        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., orange, friendly, tabby"
          />
        </div>
        
        {/* Location */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Location *
            </label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleGetLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? "Getting Location..." : "Use My Location"}
            </Button>
          </div>
          
          {coordinates && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <p>
                <strong>Coordinates:</strong> {coordinates[1]}, {coordinates[0]}
              </p>
            </div>
          )}
          
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Address (optional)
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Central Park, New York"
            />
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting || !coordinates}
          >
            {isSubmitting ? "Adding Cat..." : "Add Cat"}
          </Button>
        </div>
      </form>
    </div>
  );
} 