// app/api/scheduled/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Return empty array for scheduled posts
    return NextResponse.json({ 
      scheduled: [],
      message: "No scheduled posts"
    });
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json({ scheduled: [] });
  }
}