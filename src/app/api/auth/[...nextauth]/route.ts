import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Add timeout logic specific to the Next.js API route
const handler = async (req: Request, context: { params: { nextauth: string[] } }) => {
  try {
    // Use a timeout to handle potential API route hanging
    const timeoutPromise = new Promise((_, reject) => {
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        reject(new Error('API route timeout'));
      }, 9000); // 9 seconds (below the 10s Vercel limit)
    });

    // Race the NextAuth handler against the timeout
    const result = await Promise.race([
      // @ts-ignore - context typing issues with NextAuth.js
      NextAuth(authOptions)(req, context),
      timeoutPromise
    ]);
    
    return result;
  } catch (error) {
    console.error("NextAuth API route error:", error);
    
    // Return a minimal error response to prevent 504 timeout errors
    return new Response(JSON.stringify({ 
      error: "Authentication timeout", 
      message: "The authentication service took too long to respond. Please try again."
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export { handler as GET, handler as POST }; 