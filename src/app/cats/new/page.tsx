"use client";

import NewCatForm from "./components/NewCatForm";

export default function AddCatPage() {
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Add a New Cat</h1>
      <p className="text-gray-600 mb-8 text-center">
        Spotted a friendly feline? Add them to our cat explorer map!
      </p>
      
      <NewCatForm />
    </div>
  );
} 