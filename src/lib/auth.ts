import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

// Fallback adapter if MongoDB connection fails
const createFallbackAdapter = () => {
  return {
    createUser: async () => {
      console.error("Using fallback adapter - MongoDB connection issue");
      throw new Error("Database connection failed");
    },
    // Implement other required adapter methods with fallbacks
    getUser: async () => null,
    getUserByEmail: async () => null,
    getUserByAccount: async () => null,
    linkAccount: async () => null,
    createSession: async () => ({}),
    getSessionAndUser: async () => null,
    updateSession: async () => null,
    deleteSession: async () => null,
    // ...other required methods
  };
};

// Try to create MongoDB adapter with error handling
const getAdapter = async () => {
  try {
    // Test the connection before using it
    await clientPromise;
    return MongoDBAdapter(clientPromise);
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    // Return fallback adapter that will fail gracefully
    return createFallbackAdapter();
  }
};

export const authOptions: AuthOptions = {
  // Use a function that returns the adapter to allow for error handling
  adapter: MongoDBAdapter(clientPromise), // Will be invoked by NextAuth
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
    session: async ({ session, user }) => {
      if (session?.user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Add error page for better user experience
  },
  // Add debug in development only
  debug: process.env.NODE_ENV === 'development',
  // Set longer timeout for OAuth token exchange
  jwt: {
    maxAge: 60 * 60, // 1 hour
  },
  // Use the environment variable for the secret
  secret: process.env.NEXTAUTH_SECRET,
}; 