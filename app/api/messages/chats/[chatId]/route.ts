// app/api/messages/chats/[chatId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const { chatId } = params;

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // ✅ Verify user is in the chat
    let chatQuery: any = { participants: session.user.id };
    
    if (ObjectId.isValid(chatId)) {
      chatQuery._id = new ObjectId(chatId);
    } else {
      chatQuery._id = chatId;
    }

    const chat = await db.collection("chats").findOne(chatQuery);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    // ✅ Get messages
    const messages = await db.collection("messages")
      .find({ chat: chatId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // ✅ Get sender info for each message
    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        // ✅ Convert sender ID to ObjectId if valid
        let senderQuery: any = {};
        if (ObjectId.isValid(message.sender)) {
          senderQuery._id = new ObjectId(message.sender);
        } else {
          senderQuery._id = message.sender;
        }
        
        const sender = await db.collection("users").findOne(
          senderQuery,
          { projection: { name: 1, username: 1, image: 1 } }
        );
        return {
          ...message,
          _id: message._id.toString(),
          sender: sender ? {
            id: sender._id.toString(),
            name: sender.name,
            username: sender.username,
            image: sender.image,
          } : null,
        };
      })
    );

    return NextResponse.json({ 
      messages: messagesWithSender.reverse(),
      chat: {
        _id: chat._id.toString(),
        participants: chat.participants,
      }
    });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}