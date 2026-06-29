import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 });

  // Clear all cookies
  response.cookies.getAll().forEach((cookie) => {
    response.cookies.delete(cookie.name);
  });

  // Clear session cookies specifically
  response.cookies.delete("next-auth.session-token");
  response.cookies.delete("next-auth.csrf-token");
  response.cookies.delete("next-auth.callback-url");

  return response;
}
