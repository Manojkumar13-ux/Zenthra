// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    const db = await connectToDatabase();

    // ✅ Verify user is in the chat
    const chat = await db.collection("chats").findOne({
      _id: chatId,
      participants: session.user.id,
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    // ✅ Get messages
    const messages = await db.collection("messages")
      .find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("messages").countDocuments({ chat: chatId });

    // ✅ Get sender info for each message
    const messagesWithSender = await Promise.all(
      messages.map(async (message) => {
        const sender = await db.collection("users").findOne(
          { _id: message.sender },
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
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, content } = await req.json();

    if (!chatId || !content) {
      return NextResponse.json({ error: "Chat ID and content are required" }, { status: 400 });
    }

    const db = await connectToDatabase();

    // ✅ Verify user is in the chat
    const chat = await db.collection("chats").findOne({
      _id: chatId,
      participants: session.user.id,
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    // ✅ Create message
    const message = {
      chat: chatId,
      sender: session.user.id,
      content: content.trim(),
      createdAt: new Date(),
      read: false,
    };

    const result = await db.collection("messages").insertOne(message);
    const createdMessage = { ...message, _id: result.insertedId };

    // ✅ Update chat's last message
    await db.collection("chats").updateOne(
      { _id: chatId },
      { 
        $set: { 
          lastMessage: result.insertedId,
          updatedAt: new Date(),
        }
      }
    );

    // ✅ Get sender info
    const sender = await db.collection("users").findOne(
      { _id: session.user.id },
      { projection: { name: 1, username: 1, image: 1 } }
    );

    const populatedMessage = {
      ...createdMessage,
      _id: createdMessage._id.toString(),
      sender: sender ? {
        id: sender._id.toString(),
        name: sender.name,
        username: sender.username,
        image: sender.image,
      } : null,
    };

    return NextResponse.json(
      {
        message: populatedMessage,
        success: true,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}