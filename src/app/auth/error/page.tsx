"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";

// Error content component that uses search params
function ErrorContent() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("Authentication failed.");
  const [errorDetails, setErrorDetails] = useState<string>("");
  
  useEffect(() => {
    // Get error from URL parameters
    const error = searchParams.get("error");
    
    // Log all search params for debugging
    console.log("Auth error search params:", Object.fromEntries([...searchParams.entries()]));
    
    if (error) {
      switch (error) {
        case "Configuration":
          setErrorMessage("There is a problem with the server configuration.");
          break;
        case "AccessDenied":
          setErrorMessage("You do not have permission to sign in.");
          break;
        case "Verification":
          setErrorMessage("The verification link was invalid or has expired.");
          break;
        case "OAuthSignin":
        case "OAuthCallback":
        case "OAuthCreateAccount":
          setErrorMessage("There was a problem with the OAuth authentication. Please try again.");
          break;
        case "EmailCreateAccount":
          setErrorMessage("There was a problem creating your account.");
          break;
        case "Callback":
          setErrorMessage("There was a problem during authentication. This could be due to a server timeout or database issue.");
          break;
        case "OAuthAccountNotLinked":
          setErrorMessage("This email is already associated with another account.");
          break;
        case "EmailSignin":
          setErrorMessage("The email sign-in link was invalid or has expired.");
          break;
        case "CredentialsSignin":
          setErrorMessage("The login credentials were incorrect.");
          break;
        case "SessionRequired":
          setErrorMessage("You need to be signed in to access this page.");
          break;
        case "undefined":
        case undefined:
          setErrorMessage("Authentication failed. This could be due to a server timeout or connection issue with the database.");
          break;
        default:
          setErrorMessage(`Authentication error: ${error}`);
      }
    }
    
    // Check for error description for more details
    const errorDescription = searchParams.get("error_description");
    if (errorDescription) {
      setErrorDetails(errorDescription);
    }
  }, [searchParams]);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Authentication Error</h1>
      
      <p className="mb-4 text-gray-700">{errorMessage}</p>
      
      {errorDetails && (
        <p className="mb-8 text-sm text-gray-600 p-3 bg-gray-50 rounded border border-gray-200">
          {errorDetails}
        </p>
      )}
      
      <div className="flex flex-col space-y-4 mt-6">
        <Button asChild>
          <Link href="/auth/signin">
            Try Again
          </Link>
        </Button>
        
        <Button variant="outline" asChild>
          <Link href="/">
            Return to Home
          </Link>
        </Button>
      </div>
      
      <p className="mt-8 text-xs text-gray-500">
        If this problem persists, please contact support for assistance.
      </p>
    </div>
  );
}

// Loading component to show while suspense is active
function LoadingState() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Authentication Error</h1>
      <p className="mb-8 text-gray-700">Loading error details...</p>
      <div className="flex flex-col space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-100 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10 flex flex-col items-center">
        <Suspense fallback={<LoadingState />}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  );
}

// Ensure the page is dynamically rendered
export const dynamic = 'force-dynamic'; 