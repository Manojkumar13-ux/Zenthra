// lib/auth.ts - with mock mode for testing
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// ✅ Enable mock mode - bypass database
const USE_MOCK_AUTH = true; // Set to false to use real database

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // ✅ MOCK MODE - Accept any email/password
        if (USE_MOCK_AUTH) {
          console.log("🔓 MOCK MODE: User authenticated:", credentials.email);
          return {
            id: "mock-user-1",
            email: credentials.email,
            name: credentials.email.split("@")[0] || "User",
            username: credentials.email.split("@")[0] || "user",
            role: "user",
            image: null,
          };
        }

        // Real authentication (skip this if mock mode is on)
        try {
          const { connectDB } = await import("./db/connect");
          const { User } = await import("./db/models/User");
          const bcrypt = await import("bcryptjs");
          
          await connectDB();
          
          const user = await User.findOne({
            email: credentials.email.toLowerCase()
          });

          if (!user) {
            console.log("❌ User not found:", credentials.email);
            return null;
          }

          if (!user.password) {
            console.log("❌ User has no password set:", credentials.email);
            return null;
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            console.log("❌ Password mismatch for:", credentials.email);
            return null;
          }

          console.log("✅ User authenticated:", user.email);

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || user.username || user.email,
            role: user.role || "user",
            image: user.image || null,
            username: user.username || null,
          };
        } catch (error) {
          console.error('❌ Auth error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
        token.email = user.email;
        token.name = user.name;
        token.username = user.username || undefined;
        token.image = user.image || undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string || "user";
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.username = token.username as string || undefined;
        session.user.image = token.image as string || undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "mock-secret-for-development",
  debug: true,
};