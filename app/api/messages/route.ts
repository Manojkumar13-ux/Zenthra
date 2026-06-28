// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Message } from "@/lib/db/models/Message";

// GET /api/messages - Get messages for a user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      chatId,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name username image")
      .populate("readBy", "name username image")
      .lean();

    // Mark messages as read
    await Message.updateMany(
      {
        chatId,
        sender: { $ne: session.user.id },
        readBy: { $ne: session.user.id },
      },
      { $addToSet: { readBy: session.user.id } }
    );

    return NextResponse.json({
      messages: messages.reverse(),
      pagination: {
        total: await Message.countDocuments({ chatId, isDeleted: { $ne: true } }),
        page,
        limit,
        hasNext: skip + messages.length < await Message.countDocuments({ chatId, isDeleted: { $ne: true } }),
      },
    });

  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a new message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { chatId, content, type = "text", media } = body;

    if (!chatId || !content) {
      return NextResponse.json(
        { error: "Chat ID and content are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const message = await Message.create({
      chatId,
      sender: session.user.id,
      content,
      type,
      media: media || [],
      readBy: [session.user.id],
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await message.populate("sender", "name username image");
    await message.populate("readBy", "name username image");

    return NextResponse.json({
      success: true,
      message,
    });

  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}