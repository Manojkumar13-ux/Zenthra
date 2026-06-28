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
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);

// GET - Get single notification
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    await connectDB();

    const notification = await Notification.findOne({
      _id: params.id,
      user: session.user.id,
    })
      .populate("from", "name username image")
      .populate("post", "content")
      .populate("community", "name")
      .lean();

    if (!notification) {
      return NextResponse.json(
        { error: "Not found", message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error: any) {
    console.error("❌ Error fetching notification:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to fetch notification",
      },
      { status: 500 }
    );
  }
}

// PUT - Update notification (mark as read/unread)
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { read } = body;

    await connectDB();

    const notification = await Notification.findOneAndUpdate(
      { _id: params.id, user: session.user.id },
      { read: read !== undefined ? read : true },
      { new: true }
    )
      .populate("from", "name username image")
      .populate("post", "content")
      .populate("community", "name")
      .lean();

    if (!notification) {
      return NextResponse.json(
        { error: "Not found", message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ notification });
  } catch (error: any) {
    console.error("❌ Error updating notification:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to update notification",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized", message: "You must be logged in" },
        { status: 401 }
      );
    }

    await connectDB();

    const result = await Notification.findOneAndDelete({
      _id: params.id,
      user: session.user.id,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Not found", message: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting notification:", error);
    return NextResponse.json(
      {
        error: "Server error",
        message: process.env.NODE_ENV === "development" ? error.message : "Failed to delete notification",
      },
      { status: 500 }
    );
  }
}