// app/api/notifications/unread-count/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    // Count unread notifications for the current user
    try {
      const count = await db.collection("notifications").countDocuments({
        userId: session.user.id,
        read: false,
      });
      return NextResponse.json({ count });
    } catch (error) {
      // If collection doesn't exist, return 0
      console.log("Notifications collection not found, returning 0");
      return NextResponse.json({ count: 0 });
    }
  } catch (error) {
    console.error("Failed to fetch unread notifications:", error);
    return NextResponse.json({ count: 0 });
  }
}