"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cats, setCats] = useState<Cat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingCat, setDeletingCat] = useState<string | null>(null);

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

    // Fetch cats data
    const fetchCats = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/cats");
        if (!response.ok) {
          throw new Error("Failed to fetch cats");
        }
        const data = await response.json();
        setCats(data);
      } catch (err) {
        setError("Error loading cats data. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchCats();
    }
  }, [session, status, router]);

  const handleDelete = async (catId: string) => {
    if (!confirm("Are you sure you want to delete this cat?")) {
      return;
    }

    setDeletingCat(catId);
    try {
      const response = await fetch(`/api/cats/${catId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      // Remove cat from the list
      setCats((prev) => prev.filter((cat) => cat._id !== catId));
      setSuccessMessage("Cat deleted successfully!");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError("Error deleting cat. Please try again.");
      console.error(err);
    } finally {
      setDeletingCat(null);
    }
  };

  if (status === "loading") {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 pt-20 pb-10">
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
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
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-10">Loading cats data...</div>
            ) : cats.length === 0 ? (
              <div className="text-center py-10">No cats found.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cats.map((cat) => (
                    <tr key={cat._id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-16 w-16 relative rounded overflow-hidden">
                            <Image
                              src={cat.image}
                              alt={cat.name}
                              fill
                              className="object-cover"
                              unoptimized={cat.image.startsWith('data:')}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                            {cat.description && (
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {cat.description}
                              </div>
                            )}
                            {cat.tags && cat.tags.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {cat.tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {cat.location.coordinates.join(", ")}
                        </div>
                        {cat.location.address && (
                          <div className="text-xs text-gray-500">{cat.location.address}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(cat.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>
                          {cat.userEmail || "Unknown"}
                          {cat.updatedByEmail && cat.updatedByEmail !== cat.userEmail && (
                            <div className="text-xs text-gray-400 mt-1">
                              Updated by: {cat.updatedByEmail}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link href={`/admin/edit/${cat._id}`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(cat._id)}
                            disabled={deletingCat === cat._id}
                          >
                            {deletingCat === cat._id ? "Deleting..." : "Delete"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 