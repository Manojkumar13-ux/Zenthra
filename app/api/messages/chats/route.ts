import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Chat } from "@/lib/db/models/Chat";
import { Message } from "@/lib/db/models/Message";
import { User } from "@/lib/db/models/User";
import mongoose from "mongoose";

// GET /api/messages/chats - Get all chats for current user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;

    // Get all chats where user is a participant
    const chats = await Chat.find({
      participants: userId,
    })
      .populate("participants", "name username image online lastActive")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name username image",
        },
      })
      .sort({ updatedAt: -1 })
      .lean();

    // Get unread counts for each chat
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: userId },
          read: false,
        });

        // Get other participant info for direct messages
        let otherUser = null;
        if (!chat.isGroup) {
          otherUser = chat.participants.find(
            (p: any) => p._id.toString() !== userId
          );
        }

        return {
          ...chat,
          unreadCount,
          otherUser: otherUser || null,
        };
      })
    );

    return NextResponse.json({ chats: chatsWithUnread });
  } catch (error) {
    console.error("GET /api/messages/chats error:", error);
    return NextResponse.json(
      { chats: [], message: "Failed to fetch chats" },
      { status: 200 }
    );
  }
}

// POST /api/messages/chats - Create a new chat
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { participantIds, name, isGroup, avatar } = body;

    // Validate input
    if (!participantIds || participantIds.length === 0) {
      return NextResponse.json(
        { message: "At least one participant is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = session.user.id;

    // Ensure current user is included
    let participants = [...participantIds];
    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    // Validate all participants exist
    const validUsers = await User.find({
      _id: { $in: participants },
    }).select("_id");
    
    const validUserIds = validUsers.map((u) => u._id.toString());
    const invalidUsers = participants.filter(
      (id: string) => !validUserIds.includes(id)
    );

    if (invalidUsers.length > 0) {
      return NextResponse.json(
        { message: `Invalid users: ${invalidUsers.join(", ")}` },
        { status: 400 }
      );
    }

    // For direct messages (2 participants), check if chat already exists
    if (!isGroup && participants.length === 2) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: participants },
      })
        .populate("participants", "name username image online lastActive")
        .populate({
          path: "lastMessage",
          populate: {
            path: "sender",
            select: "name username image",
          },
        });

      if (existingChat) {
        // Get unread count for existing chat
        const unreadCount = await Message.countDocuments({
          chat: existingChat._id,
          sender: { $ne: userId },
          read: false,
        });

        const chatWithUnread = {
          ...existingChat.toObject(),
          unreadCount,
        };

        return NextResponse.json({
          chat: chatWithUnread,
          message: "Chat already exists",
        });
      }
    }

    // Create new chat
    const chatData: any = {
      participants,
      isGroup: isGroup || false,
      createdBy: userId,
    };

    if (isGroup) {
      chatData.name = name || "Group Chat";
      chatData.avatar = avatar || "";
      chatData.admins = [userId];
    }

    const chat = await Chat.create(chatData);

    // Populate the chat data
    await chat.populate("participants", "name username image online lastActive");
    await chat.populate({
      path: "lastMessage",
      populate: {
        path: "sender",
        select: "name username image",
      },
    });

    return NextResponse.json(
      { chat, message: "Chat created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/messages/chats error:", error);
    
    // Handle duplicate key errors
    if (error instanceof Error && error.name === "MongoServerError" && (error as any).code === 11000) {
      return NextResponse.json(
        { message: "Chat already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Failed to create chat", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT /api/messages/chats - Update chat (add/remove participants, update name)
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { chatId, name, avatar, addParticipants, removeParticipants } = body;

    if (!chatId) {
      return NextResponse.json(
        { message: "Chat ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { message: "Invalid chat ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = session.user.id;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return NextResponse.json(
        { message: "Chat not found" },
        { status: 404 }
      );
    }

    // Check if user is a participant
    if (!chat.participants.includes(userId)) {
      return NextResponse.json(
        { message: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    // For group chats, check if user is admin for certain actions
    if (chat.isGroup && (name || avatar || addParticipants || removeParticipants)) {
      if (!chat.admins?.includes(userId)) {
        return NextResponse.json(
          { message: "Only admins can update group settings" },
          { status: 403 }
        );
      }
    }

    // Update basic info
    if (name) chat.name = name;
    if (avatar) chat.avatar = avatar;

    // Add participants
    if (addParticipants && addParticipants.length > 0) {
      const validUsers = await User.find({
        _id: { $in: addParticipants },
      }).select("_id");
      
      const validUserIds = validUsers.map((u) => u._id.toString());
      chat.participants = [
        ...new Set([
          ...chat.participants.map((p: any) => p.toString()),
          ...validUserIds,
        ]),
      ];
    }

    // Remove participants
    if (removeParticipants && removeParticipants.length > 0) {
      // Don't remove the last participant
      if (chat.participants.length - removeParticipants.length < 1) {
        return NextResponse.json(
          { message: "Cannot remove all participants" },
          { status: 400 }
        );
      }

      chat.participants = chat.participants.filter(
        (p: any) => !removeParticipants.includes(p.toString())
      );

      // Remove from admins if they were admins
      if (chat.admins) {
        chat.admins = chat.admins.filter(
          (a: any) => !removeParticipants.includes(a.toString())
        );
      }
    }

    await chat.save();
    await chat.populate("participants", "name username image online lastActive");

    return NextResponse.json({
      chat,
      message: "Chat updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/messages/chats error:", error);
    return NextResponse.json(
      { message: "Failed to update chat" },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/chats?chatId=xxx - Delete or leave a chat
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { message: "Chat ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { message: "Invalid chat ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const userId = session.user.id;
    const chat = await Chat.findById(chatId);

    if (!chat) {
      return NextResponse.json(
        { message: "Chat not found" },
        { status: 404 }
      );
    }

    // Check if user is a participant
    if (!chat.participants.includes(userId)) {
      return NextResponse.json(
        { message: "You are not a participant in this chat" },
        { status: 403 }
      );
    }

    // For group chats, just remove the user
    if (chat.isGroup) {
      chat.participants = chat.participants.filter(
        (p: any) => p.toString() !== userId
      );

      // Remove from admins if they were an admin
      if (chat.admins) {
        chat.admins = chat.admins.filter(
          (a: any) => a.toString() !== userId
        );
      }

      // If no participants left, delete the chat
      if (chat.participants.length === 0) {
        await Chat.deleteOne({ _id: chatId });
        await Message.deleteMany({ chat: chatId });
        return NextResponse.json({
          message: "Chat deleted successfully",
          deleted: true,
        });
      }

      await chat.save();
      return NextResponse.json({
        message: "You left the group chat",
        chat,
        left: true,
      });
    }

    // For direct messages, allow deletion if both users agree or if user is admin
    if (session.user.role === "admin") {
      await Chat.deleteOne({ _id: chatId });
      await Message.deleteMany({ chat: chatId });
      return NextResponse.json({
        message: "Chat deleted successfully",
        deleted: true,
      });
    }

    // For direct messages, just remove the user (soft delete)
    chat.participants = chat.participants.filter(
      (p: any) => p.toString() !== userId
    );

    if (chat.participants.length === 0) {
      await Chat.deleteOne({ _id: chatId });
      await Message.deleteMany({ chat: chatId });
      return NextResponse.json({
        message: "Chat deleted successfully",
        deleted: true,
      });
    }

    await chat.save();
    return NextResponse.json({
      message: "You left the conversation",
      chat,
      left: true,
    });
  } catch (error) {
    console.error("DELETE /api/messages/chats error:", error);
    return NextResponse.json(
      { message: "Failed to delete chat" },
      { status: 500 }
    );
  }
}