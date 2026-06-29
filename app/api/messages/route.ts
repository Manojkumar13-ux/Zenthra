// app/api/messages/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ Fixed import
import { connectDB } from "@/lib/db/connect";
import { Message } from "@/lib/db/models/Message";
import { Chat } from "@/lib/db/models/Chat";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user is in the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: session.user.id,
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found or unauthorized" },
        { status: 404 }
      );
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name username image")
      .lean();

    const total = await Message.countDocuments({ chat: chatId });

    return NextResponse.json({
      messages: messages.reverse(),
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
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId, content } = await req.json();

    if (!chatId || !content) {
      return NextResponse.json(
        { error: "Chat ID and content are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify user is in the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: session.user.id,
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found or unauthorized" },
        { status: 404 }
      );
    }

    const message = await Message.create({
      chat: chatId,
      sender: session.user.id,
      content: content.trim(),
    });

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name username image")
      .lean();

    return NextResponse.json({
      message: populatedMessage,
      success: true,
    }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}