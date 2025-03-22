"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>("Authentication failed.");
  
  useEffect(() => {
    // Get error from URL parameters
    const error = searchParams.get("error");
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
        default:
          setErrorMessage(`Authentication error: ${error}`);
      }
    }
  }, [searchParams]);

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10 flex flex-col items-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-red-600">Authentication Error</h1>
          
          <p className="mb-8 text-gray-700">{errorMessage}</p>
          
          <div className="flex flex-col space-y-4">
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
      </div>
    </div>
  );
} 