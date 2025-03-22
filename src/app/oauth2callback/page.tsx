"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// This component uses the search params
function CallbackHandler() {
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
  
  return null;
}

// Loading component to show while suspense is active
function LoadingState() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Processing authentication...</h1>
      <p className="text-gray-500">Please wait while we complete your sign-in.</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Suspense fallback={<LoadingState />}>
        <CallbackHandler />
        <LoadingState />
      </Suspense>
    </div>
  );
}

// Add a dynamic export config to ensure the page is not statically generated
export const dynamic = 'force-dynamic'; 