import Image from "next/image";
import Link from "next/link";
import { ICat } from "@/models/Cat";

interface CatCardProps {
  cat: ICat;
  distance?: number;
}

export default function CatCard({ cat, distance }: CatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="relative h-48 w-full">
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
                : `${distance.toFixed(1)} km`}
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
          <Link 
            href={`/cats/${String((cat as any)._id || '')}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View details →
          </Link>
        </div>
      </div>
    </div>
  );
} 