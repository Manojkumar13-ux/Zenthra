// app/api/notifications/route.ts
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
    
    // Get notifications for the current user
    let notifications = [];
    try {
      notifications = await db.collection("notifications")
        .find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
    } catch (error) {
      console.log("Notifications collection not found");
    }

    return NextResponse.json({ 
      notifications: notifications.map((n: any) => ({
        _id: n._id.toString(),
        type: n.type || "general",
        message: n.message || "",
        read: n.read || false,
        createdAt: n.createdAt || new Date().toISOString(),
        sender: n.sender || {
          id: "system",
          name: "System",
          username: "system",
          image: null,
        },
        post: n.post || null,
      }))
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ notifications: [] });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const body = await request.json();
    const { read } = body;

    // Mark all notifications as read
    try {
      await db.collection("notifications").updateMany(
        { userId: session.user.id },
        { $set: { read: true } }
      );
    } catch (error) {
      console.log("Notifications collection not found");
    }

    return NextResponse.json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Failed to mark as read" }, { status: 500 });
  }
}