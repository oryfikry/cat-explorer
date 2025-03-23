"use client";

import { useState, useEffect, FormEvent, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X } from "lucide-react";

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
  
  // Declare isLoading state for form submission
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  // Image resizing function to reduce image size below 1MB
  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Create image object for dimension calculation
      const img = new globalThis.Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (!e.target?.result) {
          return reject(new Error("Failed to read file"));
        }
        
        img.src = e.target.result as string;
        
        img.onload = () => {
          // Get original dimensions
          let width = img.width;
          let height = img.height;
          let quality = 0.7; // Start with 70% quality
          
          // Force 16:9 aspect ratio
          const targetAspectRatio = 16 / 9;
          
          // Calculate new dimensions maintaining 16:9
          if (width / height > targetAspectRatio) {
            // Image is wider than 16:9, crop width
            width = Math.round(height * targetAspectRatio);
          } else {
            // Image is taller than 16:9, crop height
            height = Math.round(width / targetAspectRatio);
          }
          
          // If image is very large, reduce dimensions
          // Max dimensions 1600px (width) or 900px (height) for 16:9
          const MAX_WIDTH = 1600;
          
          if (width > MAX_WIDTH) {
            width = MAX_WIDTH;
            height = Math.round(width / targetAspectRatio);
          }
          
          // Create canvas for resizing
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error("Could not get canvas context"));
          }
          
          // Draw with white background to handle transparent PNGs
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          // Center the image to crop to 16:9
          const sourceX = (img.width - width) / 2;
          const sourceY = (img.height - height) / 2;
          
          // Draw the image with cropping to maintain 16:9
          ctx.drawImage(
            img,
            Math.max(0, sourceX),
            Math.max(0, sourceY),
            Math.min(img.width, width),
            Math.min(img.height, height),
            0,
            0,
            width,
            height
          );
          
          // Convert to base64 and compress
          let result = canvas.toDataURL('image/jpeg', quality);
          
          // Check size and reduce quality if needed
          while (result.length > 1024 * 1024 && quality > 0.3) {
            quality -= 0.1;
            result = canvas.toDataURL('image/jpeg', quality);
          }
          
          resolve(result);
        };
        
        img.onerror = (err) => reject(err);
      };
      
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };
  
  // Handle file selection
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if file is an image
      if (!file.type.match('image.*')) {
        setError("Please select an image file (JPEG, PNG, etc.)");
        return;
      }
      
      // Check file size (limit to 10MB for initial upload)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size should be less than 10MB");
        return;
      }
      
      setSelectedFile(file);
      setIsLoading(true);
      setError("");
      
      // Create a preview and resize if needed
      resizeImage(file)
        .then(resizedDataUrl => {
          setPreviewUrl(resizedDataUrl);
          // Show file size in MB for debugging
          const sizeInMB = (resizedDataUrl.length * 0.75) / (1024 * 1024); // Base64 is ~33% larger than binary
          console.log(`Resized image size: ${sizeInMB.toFixed(2)}MB`);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Error resizing image:", err);
          setError("Error processing image. Please try another file.");
          handleRemoveFile();
          setIsLoading(false);
        });
    }
  };
  
  const handleRemoveFile = () => {
    if (selectedFile) {
      setSelectedFile(null);
      
      // Clear file input value
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Clear preview
      if (previewUrl) {
        // No need to revoke object URL for data URLs
        setPreviewUrl(null);
      }
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setError("You must be logged in to add a cat.");
      return;
    }
    
    // Check if we have either imageUrl or selectedFile
    if (!name || (!imageUrl && !previewUrl) || !coordinates) {
      setError("Please fill in all required fields, provide an image, and a location.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // Determine which image to use (file upload or URL)
      let finalImageUrl = imageUrl;
      
      // If a file was selected, use the already resized data URL
      if (previewUrl) {
        finalImageUrl = previewUrl;
        
        // Verify the image size is below 1MB
        if (finalImageUrl.length > 1.3 * 1024 * 1024) { // Allow a small buffer
          setError("Image is still too large after resizing. Please select a smaller image.");
          setIsSubmitting(false);
          return;
        }
      } else if (imageUrl) {
        // If using an external URL, validate it
        try {
          new URL(imageUrl);
        } catch (e) {
          setError("Please enter a valid image URL");
          setIsSubmitting(false);
          return;
        }
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
                    {isLoading ? "Processing..." : "Select a photo from your device"}
                  </div>
                  <input
                    id="file-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
              </div>
              
              <p className="text-xs text-center text-gray-500">
                Supported formats: JPG, PNG, GIF, etc. Max size: 10MB
              </p>
              <p className="text-xs text-center text-blue-500">
                Images will be automatically resized to under 1MB
              </p>
            </div>
            
            {/* File preview */}
            {isLoading && (
              <div className="mt-4 text-center p-4">
                <svg className="animate-spin h-6 w-6 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-sm text-blue-600">Resizing image...</p>
              </div>
            )}
            
            {previewUrl && !isLoading && (
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
              <div className="mt-4">
                <div className="relative w-36 aspect-video">
                  <Image
                    src={imageUrl}
                    alt="Selected file"
                    fill
                    className="object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => {
                      setImageUrl("");
                      fileInputRef.current!.value = "";
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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