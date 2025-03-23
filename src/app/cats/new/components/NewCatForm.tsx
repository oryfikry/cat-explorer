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
  
  // Camera capture
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraSupported, setIsCameraSupported] = useState(true);
  
  // Location handling
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  useEffect(() => {
    // Redirect if not logged in
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);
  
  // Clean up camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);
  
  // Check if camera is supported by the browser
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const hasCamera = devices.some(device => device.kind === 'videoinput');
          setIsCameraSupported(hasCamera);
          if (!hasCamera) {
            console.log('No camera detected on this device');
          }
        })
        .catch(err => {
          console.error('Error checking camera availability:', err);
          setIsCameraSupported(false);
        });
    } else {
      setIsCameraSupported(false);
      console.log('MediaDevices API not supported in this browser');
    }
  }, []);
  
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
  
  const startCamera = async () => {
    try {
      setError("");
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }
      
      console.log('Requesting camera access...');
      
      // First try with environment camera (rear camera on mobile)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
              .then(() => {
                console.log('Camera started successfully');
                setCameraStream(stream);
                setShowCamera(true);
              })
              .catch(err => {
                console.error('Error playing video:', err);
                throw new Error('Failed to initialize video stream');
              });
          };
        } else {
          throw new Error('Video element not found');
        }
      } catch (envErr) {
        console.warn('Failed to access environment camera, trying default camera...', envErr);
        
        // If environment camera fails, try with any camera
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
              .then(() => {
                console.log('Default camera started successfully');
                setCameraStream(stream);
                setShowCamera(true);
              })
              .catch(err => {
                console.error('Error playing video:', err);
                throw new Error('Failed to initialize video stream');
              });
          };
        } else {
          throw new Error('Video element not found');
        }
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      setError(`Unable to access camera: ${err.message || 'Unknown error'}. Please check camera permissions or use image URL instead.`);
      setShowCamera(false);
      setIsCameraSupported(false);
    }
  };
  
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Cannot capture photo: video or canvas element not available");
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Ensure video is playing and has dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError("Cannot capture photo: video stream not ready");
        return;
      }
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85); // Add quality parameter
          if (dataUrl === 'data:,') {
            throw new Error('Empty data URL');
          }
          
          setCapturedImage(dataUrl);
          
          // Stop camera stream
          if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
          }
          
          setShowCamera(false);
          console.log('Photo captured successfully');
        } catch (e) {
          console.error('Error creating data URL:', e);
          setError("Failed to process captured image. Please try again or use image URL.");
        }
      } else {
        setError("Failed to get canvas context");
      }
    } catch (err) {
      console.error("Error in capturePhoto:", err);
      setError("Failed to capture image. Please try again or use image URL.");
    }
  };
  
  const resetCamera = () => {
    setCapturedImage(null);
    // Stop existing stream if any
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      setError("You must be logged in to add a cat.");
      return;
    }
    
    // Check if we have either imageUrl or capturedImage
    if (!name || (!imageUrl && !capturedImage) || !coordinates) {
      setError("Please fill in all required fields, provide an image, and a location.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    try {
      // In a real app, this would be an API call to save the cat data
      // including uploading the captured image if present
      
      // If using captured image, we would upload it to server/cloud storage
      // const imageToUse = capturedImage || imageUrl;
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
      
      // Reset form after successful submission
      setName("");
      setDescription("");
      setTags("");
      setImageUrl("");
      setAddress("");
      setCoordinates(null);
      setCapturedImage(null);
      
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
        
        {/* Camera and Image Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">
              Cat Photo *
            </label>
            
            <div className="space-x-2">
              {isCameraSupported && !showCamera && !capturedImage && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={startCamera}
                >
                  Take Photo
                </Button>
              )}
              
              {capturedImage && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    resetCamera();
                    startCamera();
                  }}
                >
                  Retake Photo
                </Button>
              )}
            </div>
          </div>
          
          {/* Camera view */}
          {showCamera && (
            <div className="space-y-2">
              <div className="relative rounded-md overflow-hidden aspect-video bg-gray-100">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex justify-center">
                <Button 
                  type="button"
                  onClick={capturePhoto}
                  className="mx-auto"
                >
                  Capture
                </Button>
              </div>
              
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
          
          {/* Captured photo preview */}
          {capturedImage && (
            <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-md">
              <Image 
                src={capturedImage} 
                alt="Captured cat" 
                fill
                className="object-cover"
              />
            </div>
          )}
          
          {/* Show image URL field if no captured image */}
          {!capturedImage && (
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Image URL {!capturedImage && '*'}
              </label>
              <input
                type="url"
                id="image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/cat-image.jpg"
                required={!capturedImage}
              />
              
              {imageUrl && (
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
            disabled={isSubmitting || !coordinates || (!imageUrl && !capturedImage)}
          >
            {isSubmitting ? "Adding Cat..." : "Add Cat"}
          </Button>
        </div>
      </form>
    </div>
  );
} 