import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

// Lightweight wrapper for promises with timeout for serverless functions
const withTimeout = <T>(promise: Promise<T>, timeout: number, errorMessage: string): Promise<T> => {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeout);
  });
  
  return Promise.race([
    promise.then(result => {
      clearTimeout(timeoutId);
      return result;
    }),
    timeoutPromise
  ]);
};

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Log sign-in attempt with shorter timeout
        console.log("Sign-in attempt:", { 
          userId: user?.id,
          email: user?.email,
          provider: account?.provider
        });
        
        // Always return true to avoid timeouts during lengthy DB operations
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Return true to allow sign-in despite errors
        return true;
      }
    },
    session: async ({ session, user, token }) => {
      try {
        // Use a timeout to prevent hanging on session retrieval
        const sessionWithUser = await withTimeout(
          Promise.resolve().then(() => {
            if (session?.user) {
              return {
                ...session,
                user: {
                  ...session.user,
                  id: user?.id || token?.sub
                }
              };
            }
            return session;
          }),
          3000, // 3 second timeout
          "Session callback timeout"
        );
        
        return sessionWithUser;
      } catch (error) {
        console.error("Error in session callback:", error);
        // Return session without user ID in case of timeout
        return session;
      }
    },
    // Redirect to explore page after successful login
    async redirect({ url, baseUrl }) {
      // If the URL is the default sign-in callback, send to explore page
      if (url.startsWith(baseUrl) && !url.includes('/auth/error')) {
        return `${baseUrl}/explore`;
      }
      // Handle other URLs normally
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  // Disable debug in production to reduce function execution time
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error(`NextAuth error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth warning: ${code}`);
    },
    // Only log debug in development
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`NextAuth debug: ${code}`, metadata);
      }
    },
  },
  // Reduce session duration to improve performance
  session: {
    strategy: "jwt", 
    maxAge: 24 * 60 * 60, // 1 day
  },
  // Use a shorter JWT duration
  jwt: {
    maxAge: 24 * 60 * 60, // 1 day
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 