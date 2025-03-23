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

// Database collection names
const COLLECTIONS = {
  USERS: "users",
  ACCOUNTS: "accounts",
  SESSIONS: "sessions",
  VERIFICATION_TOKENS: "verification_tokens"
};

// Initialize collections if they don't exist
async function ensureCollectionsExist() {
  try {
    const client = await connectWithFastFail(3000);
    const db = client.db();
    
    // Get existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Create collections if they don't exist
    for (const collName of Object.values(COLLECTIONS)) {
      if (!collectionNames.includes(collName)) {
        console.log(`Creating collection: ${collName}`);
        await db.createCollection(collName);
      }
    }
    
    console.log("Collections verified");
    return true;
  } catch (error) {
    console.error("Error ensuring collections exist:", error);
    return false;
  }
}

// Ensure collections exist on startup
ensureCollectionsExist().catch(console.error);

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
        
        // Ensure collections exist
        await ensureCollectionsExist();
        
        // Check if user exists in MongoDB
        const collection = db.collection(COLLECTIONS.USERS);
        const existingUser = await collection.findOne({ email: user.email });
        
        console.log("Sign-in attempt:", { 
          userId: user?.id,
          email: user?.email,
          provider: account?.provider,
          userExists: !!existingUser
        });
        
        if (!existingUser && user.email) {
          // This is a new user
          console.log("New user being created:", user.email);
          
          // The adapter should handle user creation, but we can log it
          // We don't insert directly as the adapter handles this
        }
        
        // Always return true to allow sign-in
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Return true to allow sign-in despite errors
        return true;
      }
    },
    session: async ({ session, user, token }) => {
      try {
        // Get user ID from JWT token (strategy is JWT)
        const userId = token?.sub;
        
        if (!userId) {
          console.error("No userId found in token");
          return session;
        }
        
        // Add the ID to the session without database verification
        // This is faster and works with JWT strategy
        return {
          ...session,
          user: {
            ...session.user,
            id: userId
          }
        };
      } catch (error) {
        console.error("Error in session callback:", error);
        // Return session without user ID in case of error
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
  // Use JWT strategy for better performance and reliability
  session: {
    strategy: "jwt", 
    maxAge: 24 * 60 * 60, // 1 day
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 1 day
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 