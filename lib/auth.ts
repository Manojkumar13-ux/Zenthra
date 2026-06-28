// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const db = await connectToDatabase();
          const usersCollection = db.collection("users");
          
          const user = await usersCollection.findOne({
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
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const db = await connectToDatabase();
          const usersCollection = db.collection("users");
          
          let existingUser = await usersCollection.findOne({
            email: user.email
          });

          if (!existingUser) {
            const newUser = {
              email: user.email,
              name: user.name || profile?.name || "",
              username: user.email?.split("@")[0] || "user",
              image: user.image || profile?.picture || "",
              googleId: account.providerAccountId,
              role: "user",
              bio: "",
              location: "",
              website: "",
              followers: [],
              following: [],
              followersCount: 0,
              followingCount: 0,
              postsCount: 0,
              isVerified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            
            const result = await usersCollection.insertOne(newUser);
            user.id = result.insertedId.toString();
            console.log("✅ New Google user created:", user.email);
          } else {
            user.id = existingUser._id.toString();
            await usersCollection.updateOne(
              { _id: existingUser._id },
              { 
                $set: { 
                  image: user.image || existingUser.image,
                  name: user.name || existingUser.name,
                  googleId: account.providerAccountId,
                  updatedAt: new Date()
                } 
              }
            );
            console.log("✅ Existing Google user updated:", user.email);
          }
        } catch (error) {
          console.error("❌ Google signIn error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
        token.email = user.email;
        token.name = user.name;
        token.username = user.username || null;
        token.image = user.image || null;
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
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};