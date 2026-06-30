export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Chat } from "@/lib/db/models/Chat";
import { Message } from "@/lib/db/models/Message";
import { User } from "@/lib/db/models/User";
import { z } from "zod";

const updateChatSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  avatar: z.string().url().optional(),
  addParticipants: z.array(z.string()).optional(),
  removeParticipants: z.array(z.string()).optional(),
});

// GET /api/messages/chats/[chatId] - Get chat details
export async function GET(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const chat = await Chat.findById(params.chatId)
      .populate("participants", "name username image online lastActive")
      .populate("admins", "name username image")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name username image",
        },
      });

    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.some((p: any) => p._id.toString() === session.user.id)) {
      return NextResponse.json(
        { message: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("GET /api/messages/chats/[chatId] error:", error);
    return NextResponse.json({ message: "Failed to fetch chat details" }, { status: 500 });
  }
}

// PUT /api/messages/chats/[chatId] - Update chat (group settings)
export async function PUT(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const chat = await Chat.findById(params.chatId);
    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.includes(session.user.id)) {
      return NextResponse.json(
        { message: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    // For group chats, check if user is admin
    if (chat.isGroup && !chat.admins?.includes(session.user.id)) {
      return NextResponse.json(
        { message: "Only admins can update group settings" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = updateChatSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid update data", errors: parsed.error.errors },
        { status: 400 }
      );
    }

    const { name, avatar, addParticipants, removeParticipants } = parsed.data;

    // Update basic info
    if (name) chat.name = name;
    if (avatar) chat.avatar = avatar;

    // Add participants
    if (addParticipants && addParticipants.length > 0) {
      const validUsers = await User.find({
        _id: { $in: addParticipants },
      });

      const validUserIds = validUsers.map((u) => u._id.toString());
      chat.participants = [
        ...new Set([...chat.participants.map((p: any) => p.toString()), ...validUserIds]),
      ];
    }

    // Remove participants
    if (removeParticipants && removeParticipants.length > 0) {
      chat.participants = chat.participants.filter(
        (p: any) => !removeParticipants.includes(p.toString())
      );
    }

    await chat.save();

    await chat.populate("participants", "name username image online lastActive");

    return NextResponse.json({ chat });
  } catch (error) {
    console.error("PUT /api/messages/chats/[chatId] error:", error);
    return NextResponse.json({ message: "Failed to update chat" }, { status: 500 });
  }
}

// DELETE /api/messages/chats/[chatId] - Delete/leave chat
export async function DELETE(req: Request, { params }: { params: { chatId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const chat = await Chat.findById(params.chatId);
    if (!chat) {
      return NextResponse.json({ message: "Chat not found" }, { status: 404 });
    }

    // Check if user is a participant
    if (!chat.participants.includes(session.user.id)) {
      return NextResponse.json(
        { message: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    // If group chat, remove user from participants
    if (chat.isGroup) {
      chat.participants = chat.participants.filter((p: any) => p.toString() !== session.user.id);

      // If user was admin, remove from admins
      if (chat.admins) {
        chat.admins = chat.admins.filter((a: any) => a.toString() !== session.user.id);
      }

      // If no participants left, delete the chat
      if (chat.participants.length === 0) {
        await Chat.deleteOne({ _id: params.chatId });
        await Message.deleteMany({ chat: params.chatId });
        return NextResponse.json({ message: "Chat deleted" });
      }

      await chat.save();
      return NextResponse.json({
        message: "You left the group",
        chat,
      });
    }

    // For direct messages, only allow deletion if both users agree or admin
    if (session.user.role === "admin") {
      await Chat.deleteOne({ _id: params.chatId });
      await Message.deleteMany({ chat: params.chatId });
      return NextResponse.json({ message: "Chat deleted" });
    }

    return NextResponse.json({ message: "You can only leave group chats" }, { status: 403 });
  } catch (error) {
    console.error("DELETE /api/messages/chats/[chatId] error:", error);
    return NextResponse.json({ message: "Failed to delete chat" }, { status: 500 });
  }
}
