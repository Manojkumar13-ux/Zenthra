// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    // ✅ Convert chatId to ObjectId for query
    let chatQuery: any = { participants: session.user.id };
    
    // Only use ObjectId if chatId is valid
    if (ObjectId.isValid(chatId)) {
      chatQuery._id = new ObjectId(chatId);
    } else {
      chatQuery._id = chatId;
    }

    // ✅ Verify user is in the chat
    const chat = await db.collection("chats").findOne(chatQuery);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    // ✅ Get messages - use string ID for query
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

    // ✅ Convert chatId to ObjectId for query
    let chatQuery: any = { participants: session.user.id };
    
    if (ObjectId.isValid(chatId)) {
      chatQuery._id = new ObjectId(chatId);
    } else {
      chatQuery._id = chatId;
    }

    // ✅ Verify user is in the chat
    const chat = await db.collection("chats").findOne(chatQuery);

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
      chatQuery,
      { 
        $set: { 
          lastMessage: result.insertedId.toString(),
          updatedAt: new Date(),
        }
      }
    );

    // ✅ Get sender info - convert to ObjectId
    let senderQuery: any = {};
    if (ObjectId.isValid(session.user.id)) {
      senderQuery._id = new ObjectId(session.user.id);
    } else {
      senderQuery._id = session.user.id;
    }
    
    const sender = await db.collection("users").findOne(
      senderQuery,
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