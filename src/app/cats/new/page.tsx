"use client";

import Navbar from "@/components/layout/Navbar";
import NewCatForm from "./components/NewCatForm";

export default function NewCatPage() {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10">
        <h1 className="text-3xl font-bold mb-2">Add New Cat Sighting</h1>
        <p className="text-gray-600 mb-8">
          Share a stray cat you've encountered by filling out the form below.
        </p>
        
        <NewCatForm />
      </div>
    </div>
  );
} 