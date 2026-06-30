// app/api/messages/chats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    
    // ✅ Get all chats for the current user
    const chats = await db.collection("chats")
      .find({ participants: session.user.id })
      .sort({ updatedAt: -1 })
      .toArray();

    // ✅ Get last message for each chat
    const chatsWithDetails = await Promise.all(
      chats.map(async (chat) => {
        const chatId = chat._id.toString();
        
        const lastMessage = await db.collection("messages")
          .find({ chat: chatId })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();

        // Get other participant
        const otherParticipantId = chat.participants.find(
          (p: string) => p !== session.user.id
        );
        
        // ✅ Convert otherParticipantId to ObjectId if valid
        let otherUserQuery: any = {};
        if (otherParticipantId && ObjectId.isValid(otherParticipantId)) {
          otherUserQuery._id = new ObjectId(otherParticipantId);
        } else if (otherParticipantId) {
          otherUserQuery._id = otherParticipantId;
        }
        
        const otherUser = otherParticipantId 
          ? await db.collection("users").findOne(
              otherUserQuery,
              { projection: { name: 1, username: 1, image: 1 } }
            )
          : null;

        // Count unread messages
        const unreadCount = await db.collection("messages").countDocuments({
          chat: chatId,
          sender: { $ne: session.user.id },
          read: false,
        });

        return {
          ...chat,
          _id: chatId,
          participants: chat.participants,
          lastMessage: lastMessage[0] || null,
          otherUser: otherUser ? {
            id: otherUser._id.toString(),
            name: otherUser.name,
            username: otherUser.username,
            image: otherUser.image,
          } : null,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ chats: chatsWithDetails });
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}