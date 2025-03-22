import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

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
        // Log sign-in attempt
        console.log("Sign-in attempt:", { 
          userId: user?.id,
          email: user?.email,
          provider: account?.provider
        });
        
        // Always return true for now to allow sign-in while debugging
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        // Allow sign-in even if there's an error in our tracking
        return true;
      }
    },
    session: async ({ session, user, token }) => {
      try {
        if (session?.user) {
          (session.user as any).id = user?.id || token?.sub;
        }
        return session;
      } catch (error) {
        console.error("Error in session callback:", error);
        return session;
      }
    },
    // Add redirect callback to send users to explore page after login
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
  debug: true, // Enable debug mode on both dev and production temporarily
  logger: {
    error(code, metadata) {
      console.error(`NextAuth error: ${code}`, metadata);
    },
    warn(code) {
      console.warn(`NextAuth warning: ${code}`);
    },
    debug(code, metadata) {
      console.log(`NextAuth debug: ${code}`, metadata);
    },
  },
  session: {
    strategy: "jwt", 
    maxAge: 30 * 60, // 30 minutes
  },
  secret: process.env.NEXTAUTH_SECRET,
}; 