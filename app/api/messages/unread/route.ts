// app/api/messages/unread/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ Fixed import
import { connectDB } from "@/lib/db/connect";
import { Message } from "@/lib/db/models/Message";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    // Count unread messages for the current user
    const count = await Message.countDocuments({
      recipient: session.user.id,
      read: false,
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unread messages count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread messages" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { messageId } = await req.json();

    if (!messageId) {
      return NextResponse.json(
        { error: "Message ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const message = await Message.findOneAndUpdate(
      { _id: messageId, recipient: session.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!message) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return NextResponse.json(
      { error: "Failed to mark message as read" },
      { status: 500 }
    );
  }
}