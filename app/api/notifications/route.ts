// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface Notification {
  _id: any;
  type: string;
  message: string;
  read: boolean;
  createdAt: Date;
  sender?: {
    id: string;
    name: string;
    username: string;
    image: string | null;
  };
  post?: {
    id: string;
    content: string;
  } | null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    // ✅ Type the notifications array
    let notifications: Notification[] = [];
    
    try {
      const docs = await db.collection("notifications")
        .find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
      
      notifications = docs.map((doc: any) => ({
        _id: doc._id.toString(),
        type: doc.type || "general",
        message: doc.message || "",
        read: doc.read || false,
        createdAt: doc.createdAt || new Date(),
        sender: doc.sender || {
          id: "system",
          name: "System",
          username: "system",
          image: null,
        },
        post: doc.post || null,
      }));
    } catch (error) {
      console.log("Notifications collection not found or error:", error);
    }

    return NextResponse.json({ notifications });
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