"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";

export default function SignInPage() {
  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-10 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8">Sign in to Cat Explorer</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-medium mb-6 text-center">Choose a sign in method</h2>
          
          <Button 
            className="w-full flex items-center justify-center gap-2 mb-4"
            onClick={() => signIn('google', { 
              callbackUrl: 'https://cat-explorer-orcin.vercel.app/oauth2callback'
            })}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08h7.545z"/>
            </svg>
            Sign in with Google
          </Button>
          
          <p className="text-xs text-center text-gray-500 mt-6">
            By signing in, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
} 