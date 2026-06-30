// app/api/messages/unread-count/route.ts
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
    
    const count = await db.collection("messages").countDocuments({
      recipientId: session.user.id,
      read: false,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch unread messages:", error);
    return NextResponse.json({ error: "Failed to fetch unread messages" }, { status: 500 });
  }
}