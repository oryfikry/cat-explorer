"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";

export default function Home() {
  return (
    <div>
      <Navbar />
      <div className="pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
                  Discover Stray Cats Around The World
                </h1>
                <p className="text-lg text-gray-600 max-w-[600px]">
                  Cat Explorer helps you find, document, and share stray cats in your neighborhood and around the world. Join our community today!
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild size="lg">
                    <Link href="/explore">
                      Explore Cats
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/map">
                      View Map
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-[400px] w-full rounded-lg overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000"
                  alt="Stray cat"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold">How It Works</h2>
              <p className="text-gray-600 mt-2">Explore, document, and connect with cats worldwide</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Discover Nearby Cats</h3>
                <p className="text-gray-600">Find stray cats in your neighborhood and see photos and information shared by other users.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Document Cat Sightings</h3>
                <p className="text-gray-600">Add photos, descriptions, and precise locations of stray cats you encounter.</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </div>
                <h3 className="text-xl font-medium mb-2">Connect With Cat Lovers</h3>
                <p className="text-gray-600">Join a community of cat enthusiasts who share your passion for stray cats.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
