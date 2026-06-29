import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import mongoose from "mongoose";

// Define Notification Schema
const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "mention", "follow", "message", "repost", "community"],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Notification =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

// PUT - Mark all notifications as read
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    await connectDB();

    // Get count of unread notifications before updating
    const unreadCount = await Notification.countDocuments({
      user: session.user.id,
      read: false,
    });

    // Mark all as read
    const result = await Notification.updateMany(
      { user: session.user.id, read: false },
      { read: true }
    );

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount,
      unreadCount,
      message: `${result.modifiedCount} notifications marked as read`,
    });
  } catch (error: any) {
    console.error("❌ Error marking all as read:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message:
          process.env.NODE_ENV === "development" ? error.message : "Failed to mark all as read",
      },
      { status: 500 }
    );
  }
}
