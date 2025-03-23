"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Cat = {
  _id: string;
  name: string;
  image: string;
  description?: string;
  location: {
    coordinates: [number, number];
    address?: string;
  };
  tags?: string[];
  userId: string;
  userEmail?: string;
  updatedByEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export default function EditCatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const catId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string>("");
  
  const [catData, setCatData] = useState<{
    name: string;
    image: string;
    description: string;
    location: {
      coordinates: [number, number];
      address: string;
    };
    tags: string;
  }>({
    name: "",
    image: "",
    description: "",
    location: {
      coordinates: [0, 0],
      address: "",
    },
    tags: "",
  });

  const [catMetadata, setCatMetadata] = useState<{
    createdAt: string;
    updatedAt: string;
    userEmail?: string;
    updatedByEmail?: string;
  }>({
    createdAt: "",
    updatedAt: "",
    userEmail: "",
    updatedByEmail: "",
  });

  useEffect(() => {
    // Check authentication and admin status
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
      return;
    }

    if (session && session.user?.email !== "oryza4444@gmail.com") {
      router.push("/");
      return;
    }

    // Fetch cat data
    const fetchCat = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/cats/${catId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch cat data");
        }
        const data: Cat = await response.json();
        
        setCatData({
          name: data.name,
          image: data.image,
          description: data.description || "",
          location: {
            coordinates: data.location.coordinates,
            address: data.location.address || "",
          },
          tags: data.tags ? data.tags.join(", ") : "",
        });
        
        setCatMetadata({
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          userEmail: data.userEmail,
          updatedByEmail: data.updatedByEmail,
        });
        
        setOriginalImage(data.image);
      } catch (err) {
        setError("Error loading cat data. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user && catId) {
      fetchCat();
    }
  }, [session, status, router, catId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "lat" || name === "lng") {
      setCatData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          coordinates: 
            name === "lat" 
              ? [parseFloat(value) || 0, prev.location.coordinates[1]] 
              : [prev.location.coordinates[0], parseFloat(value) || 0],
        },
      }));
    } else if (name === "address") {
      setCatData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          address: value,
        },
      }));
    } else {
      setCatData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    try {
      const resizedImage = await resizeImage(file);
      setCatData((prev) => ({
        ...prev,
        image: resizedImage,
      }));
    } catch (err) {
      setError("Error processing image. Please try again.");
      console.error(err);
    }
  };

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new globalThis.Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
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
          
          // If image is still too large, scale down while maintaining 16:9
          const maxSize = 800;
          if (width > maxSize) {
            width = maxSize;
            height = Math.round(width / targetAspectRatio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext("2d");
          
          // Center the image to crop to 16:9
          const sourceX = (img.width - width) / 2;
          const sourceY = (img.height - height) / 2;
          
          // Draw the image with cropping to maintain 16:9
          ctx?.drawImage(
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
          
          // Start with high quality
          let quality = 0.9;
          let result = canvas.toDataURL("image/jpeg", quality);
          
          // Reduce quality until size is below 1MB
          while (result.length > 1024 * 1024 && quality > 0.3) {
            quality -= 0.1;
            result = canvas.toDataURL("image/jpeg", quality);
          }
          
          resolve(result);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!catData.name.trim()) {
      setError("Cat name is required");
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Keep original image if not changed
      const dataToSubmit = {
        ...catData,
        image: catData.image === originalImage ? undefined : catData.image,
        tags: catData.tags ? catData.tags.split(",").map(tag => tag.trim()) : undefined,
      };
      
      const response = await fetch(`/api/cats/${catId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update cat");
      }
      
      setSuccessMessage("Cat updated successfully!");
      
      // Clear success message after 3 seconds and redirect
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Error updating cat. Please try again.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-10">
          <h1 className="text-2xl font-bold mb-6">Edit Cat</h1>
          <div className="text-center py-10">Loading...</div>
        </div>
      </div>
    );
  }

  if (session?.user?.email !== "oryza4444@gmail.com") {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-10">
          <h1 className="text-2xl font-bold mb-6">Unauthorized</h1>
          <p>You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <div className="flex items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Cat</h1>
          <div className="ml-auto">
            <Button variant="outline" size="sm" href="/admin">Back to Admin</Button>
          </div>
        </div>
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6 text-sm text-gray-500">
            {catMetadata.userEmail && (
              <div>Created by: {catMetadata.userEmail}</div>
            )}
            {catMetadata.createdAt && (
              <div>Creation date: {new Date(catMetadata.createdAt).toLocaleString()}</div>
            )}
            {catMetadata.updatedByEmail && (
              <div>Last updated by: {catMetadata.updatedByEmail}</div>
            )}
            {catMetadata.updatedAt && catMetadata.updatedAt !== catMetadata.createdAt && (
              <div>Last update: {new Date(catMetadata.updatedAt).toLocaleString()}</div>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={catData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={catData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={catData.tags}
                onChange={handleInputChange}
                placeholder="friendly, striped, playful"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude *</Label>
                <Input
                  id="lat"
                  name="lat"
                  type="number"
                  step="any"
                  value={catData.location.coordinates[0]}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude *</Label>
                <Input
                  id="lng"
                  name="lng"
                  type="number"
                  step="any"
                  value={catData.location.coordinates[1]}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={catData.location.address}
                onChange={handleInputChange}
                placeholder="Optional address description"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Image</Label>
              <div className="flex items-start gap-4">
                {catData.image && (
                  <div className="w-36 aspect-video relative rounded overflow-hidden">
                    <Image
                      src={catData.image}
                      alt="Cat preview"
                      fill
                      className="object-cover"
                      unoptimized={catData.image.startsWith('data:')}
                    />
                  </div>
                )}
                <div>
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep the current image. Images will be automatically resized.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 