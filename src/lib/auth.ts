import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import { ObjectId, Document } from "mongodb";
import clientPromise, { connectWithFastFail } from "@/lib/mongodb";

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
        // Attempt to verify MongoDB connection before proceeding
        const client = await connectWithFastFail(3000);
        const db = client.db();
        
        // Check if user exists in MongoDB
        const collection = db.collection("users");
        const existingUser = await collection.findOne({ email: user.email });
        
        console.log("Sign-in attempt:", { 
          userId: user?.id,
          email: user?.email,
          provider: account?.provider,
          userExists: !!existingUser
        });
        
        if (!existingUser && user.email) {
          // This is a new user, we could add custom fields here if needed
          console.log("New user being created:", user.email);
        }
        
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
          Promise.resolve().then(async () => {
            if (session?.user) {
              // Get user ID from adapter in database session or from JWT token
              const userId = user?.id || token?.sub;
              
              if (!userId) {
                console.error("No userId found in session or token");
                return session;
              }
              
              try {
                // Verify user exists in database for extra safety
                const client = await connectWithFastFail(2000);
                const db = client.db();
                const collection = db.collection("users");
                
                // Check for the user in the database
                let dbUser: Document | null = null;
                
                // Try to find by string ID first (simplest case)
                dbUser = await collection.findOne({ id: userId });
                
                // If not found and looks like an ObjectId, try with that
                if (!dbUser && userId.length === 24 && /^[0-9a-f]{24}$/.test(userId)) {
                  try {
                    dbUser = await collection.findOne({ _id: new ObjectId(userId) });
                  } catch (err) {
                    console.warn("Failed to convert to ObjectId:", userId);
                  }
                }
                
                if (dbUser) {
                  console.log("User found in database:", userId);
                } else {
                  console.error("User not found in database:", userId);
                }
              } catch (dbError) {
                // Log but don't fail the session
                console.error("Error checking user in database:", dbError);
              }
              
              // Return the session with user ID regardless
              return {
                ...session,
                user: {
                  ...session.user,
                  id: userId
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