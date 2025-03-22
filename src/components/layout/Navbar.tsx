"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 fixed w-full top-0 left-0 z-50">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="self-center text-xl font-semibold whitespace-nowrap">🐱 Cat Explorer</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/explore" className="text-gray-600 hover:text-blue-600">
            Explore
          </Link>
          <Link href="/map" className="text-gray-600 hover:text-blue-600">
            Map
          </Link>
          
          {session ? (
            <div className="flex items-center space-x-3">
              <Link href="/cats/new" className="text-gray-600 hover:text-blue-600">
                Add Cat
              </Link>
              <div className="flex items-center space-x-2">
                {session.user?.image ? (
                  <Image 
                    src={session.user.image} 
                    alt={session.user.name || "User"} 
                    width={32} 
                    height={32}
                    className="rounded-full" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {session.user?.name?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => signIn("google")}>Sign In</Button>
          )}
        </div>
      </div>
    </nav>
  );
} 