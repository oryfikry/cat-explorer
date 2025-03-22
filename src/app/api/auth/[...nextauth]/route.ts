import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Create NextAuth handler with custom callback URL to match Google Console setting
const handler = NextAuth({
  ...authOptions,
  // Override the callback URL at the handler level
  callbacks: {
    ...authOptions.callbacks,
    redirect({ url, baseUrl }) {
      // If redirecting from OAuth provider, use the registered callback URL
      if (url.includes("callback")) {
        return "https://cat-explorer-orcin.vercel.app/oauth2callback";
      }
      // Default redirects go to home
      return baseUrl;
    }
  }
});

export { handler as GET, handler as POST }; 