"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
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
  
  // File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Location handling
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  useEffect(() => {
    // Redirect if not logged in
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);
  
  // Clean up file preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  const handleGetLocation = () => {
    setIsGettingLocation(true);
    setError("");
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates([position.coords.longitude, position.coords.latitude]);
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Set a specific error message for secure context errors
          if (error.code === 1 && error.message.includes("secure origins")) {
            setError("Geolocation requires HTTPS. Please try using this feature on a secure (HTTPS) connection or enter location manually.");
          } else {
            setError(`Failed to get your location: ${error.message}. Please try again or enter the location manually.`);
          }
          setIsGettingLocation(false);
        },
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 0 }
      );
    } else {
      setError("Geolocation is not supported by your browser. Please enter the location manually.");
      setIsGettingLocation(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic validation
      if (!file.type.startsWith('image/')) {
        setError("Please select an image file (JPG, PNG, etc.)");
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      
      // Clear any previous error
      setError("");
      
      // Create a preview URL
      const fileUrl = URL.createObjectURL(file);
      
      // Clear previous preview URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setSelectedFile(file);
      setPreviewUrl(fileUrl);
      setImageUrl(""); // Clear the image URL field as we're using file upload
    }
  };
  
  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedFile(null);
    setPreviewUrl(null);
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setError("You must be logged in to add a cat.");
      return;
    }
    
    // Check if we have either imageUrl or selectedFile
    if (!name || (!imageUrl && !selectedFile) || !coordinates) {
      setError("Please fill in all required fields, provide an image, and a location.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Determine which image to use (file upload or URL)
      let finalImageUrl = imageUrl;
      
      // If a file was selected, we'd typically upload it to a storage service
      // For this example, we'll simulate an upload delay but continue using the URL
      // In a real app, replace this with actual file upload logic
      if (selectedFile && previewUrl) {
        // Simulate file upload delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // In a real implementation, you would upload the file and get a URL back
        // finalImageUrl = await uploadFileToStorage(selectedFile);
        
        // For now, we'll use the data URL for local testing
        finalImageUrl = previewUrl;
      }
      
      // Prepare the data to send to the API
      const catData = {
        name,
        image: finalImageUrl,
        description,
        location: {
          coordinates,
          address,
        },
        tags,
      };
      
      // Make API call to save the cat
      const response = await fetch('/api/cats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(catData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add cat');
      }
      
      setSuccess(true);
      
      // Reset form after successful submission
      setName("");
      setDescription("");
      setTags("");
      setImageUrl("");
      setAddress("");
      setCoordinates(null);
      handleRemoveFile();
      
      // Redirect to explore page after a delay
      setTimeout(() => {
        router.push("/explore");
      }, 2000);
    } catch (err: any) {
      setError(`Failed to add cat: ${err.message || 'Unknown error'}`);
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
        
        {/* Image Upload and URL Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Cat Photo *
            </label>
          </div>
          
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
                    Select a photo from your device
                  </div>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
              
              <p className="text-xs text-center text-gray-500">
                Supported formats: JPG, PNG, GIF, etc. Max size: 5MB
              </p>
            </div>
            
            {/* File preview */}
            {previewUrl && (
              <div className="mt-4">
                <div className="relative aspect-video w-full overflow-hidden rounded-md">
                  <Image 
                    src={previewUrl} 
                    alt="Selected cat image" 
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveFile}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Separator */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>
          
          {/* Image URL */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL {!selectedFile && '*'}
            </label>
            <input
              type="url"
              id="image"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/cat-image.jpg"
              required={!selectedFile}
              disabled={!!selectedFile}
            />
            
            {imageUrl && !selectedFile && (
              <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-md">
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
            disabled={isSubmitting || !coordinates || (!imageUrl && !selectedFile)}
          >
            {isSubmitting ? "Adding Cat..." : "Add Cat"}
          </Button>
        </div>
      </form>
    </div>
  );
} 