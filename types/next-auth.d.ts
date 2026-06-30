// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      role?: string; // ✅ Add role
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username?: string;
    role?: string; // ✅ Add role
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: string; // ✅ Add role
  }
}