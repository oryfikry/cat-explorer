"use client";

import Navbar from "@/components/layout/Navbar";
import { Suspense } from "react";
import CatList from "./components/CatList";

export default function ExplorePage() {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 pt-25 sm:pt-20 pb-10">
        <h1 className="text-3xl font-bold mb-6">Explore Stray Cats</h1>
        
        <div className="mb-8">
          <p className="text-gray-600">
            Discover stray cats in your area and around the world. The cats below are sorted by proximity to your current location.
          </p>
        </div>
        
        <Suspense fallback={<div className="text-center py-10">Loading cats nearby...</div>}>
          <CatList />
        </Suspense>
      </div>
    </div>
  );
} 