"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    
    if (code) {
      // Redirect to the actual NextAuth callback endpoint
      window.location.href = `/api/auth/callback/google?code=${code}&state=${state || ''}`;
    } else {
      // No code found, redirect to home
      router.push('/');
    }
  }, [searchParams, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing authentication...</h1>
        <p className="text-gray-500">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
} 