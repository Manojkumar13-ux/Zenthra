// app/api/achievements/route.ts
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

    // ✅ Return empty array for achievements
    return NextResponse.json({ 
      achievements: [],
      stats: {
        total: 0,
        unlocked: 0,
        locked: 0,
      }
    });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ 
      achievements: [],
      stats: {
        total: 0,
        unlocked: 0,
        locked: 0,
      }
    });
  }
}