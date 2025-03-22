"use client";

import Navbar from "@/components/layout/Navbar";
import dynamic from "next/dynamic";

// Import map component dynamically to avoid SSR issues with leaflet
const MapWithNoSSR = dynamic(() => import("./components/CatMap"), {
  ssr: false,
  loading: () => <div className="h-[calc(100vh-80px)] flex items-center justify-center">Loading map...</div>
});

export default function MapPage() {
  return (
    <div>
      <Navbar />
      <div className="pt-16">
        <MapWithNoSSR />
      </div>
    </div>
  );
} 