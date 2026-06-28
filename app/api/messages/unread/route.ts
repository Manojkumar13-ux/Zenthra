import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Message } from "@/lib/db/models/Message";
import { Chat } from "@/lib/db/models/Chat";

// GET /api/messages/unread - Get total unread count
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get all chats where user is a participant
    const chats = await Chat.find({
      participants: session.user.id,
    }).select("_id");

    const chatIds = chats.map((chat) => chat._id);

    // Count unread messages
    const unreadCount = await Message.countDocuments({
      chat: { $in: chatIds },
      sender: { $ne: session.user.id },
      read: false,
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("GET /api/messages/unread error:", error);
    return NextResponse.json(
      { message: "Failed to get unread count" },
      { status: 500 }
    );
  }
}