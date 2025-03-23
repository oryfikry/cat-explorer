import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Simplified handler to avoid complexity in the API route
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 