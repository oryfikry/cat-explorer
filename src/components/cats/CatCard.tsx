import Image from "next/image";
import Link from "next/link";
import { ICat } from "@/models/Cat";
import { Button } from "../ui/button";

interface CatCardProps {
  cat: ICat & { _id?: string };
  distance?: number;
  id?: string;
}

export default function CatCard({ cat, distance, id }: CatCardProps) {
  // Use the provided id prop first, then fall back to cat._id if available
  const catId = id || cat._id;
  
  if (!catId) {
    console.error("No ID provided for cat:", cat.name);
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative w-full aspect-video">
        <Image
          src={cat.image}
          alt={cat.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">{cat.name}</h3>
          {distance && (
            <span className="text-sm text-gray-500">
              {distance < 1 
                ? `${Math.round(distance * 1000)} m` 
                : `${distance.toFixed(1)} km`} <span className="text-xs">From You</span>
            </span>
          )}
        </div>
        
        {cat.description && (
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
            {cat.description}
          </p>
        )}
        
        {cat.location.address && (
          <p className="mt-2 text-xs text-gray-500">
            📍 {cat.location.address}
          </p>
        )}
        
        {cat.tags && cat.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {cat.tags.map((tag) => (
              <span 
                key={tag} 
                className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-4">
          {catId && (
            <Link href={`/cats/${catId}`} className="block mt-3">
              <Button size="sm" className="w-full">View Details</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 