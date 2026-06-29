// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: string;
    username?: string;
    image?: string;
    email: string;
    name: string;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      username?: string;
      email: string;
      name: string;
      image?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    username?: string;
    email: string;
    name: string;
    image?: string;
  }
}

export {};
