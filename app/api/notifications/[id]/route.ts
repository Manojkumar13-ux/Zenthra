// app/api/notifications/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ Fixed import
import { connectDB } from "@/lib/db/connect";
import { Notification } from "@/lib/db/models/Notification";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const notification = await Notification.findOne({
      _id: params.id,
      recipient: session.user.id,
    })
      .populate("sender", "name username image")
      .populate("post", "content media")
      .lean();

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Error fetching notification:", error);
    return NextResponse.json({ error: "Failed to fetch notification" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { read } = await req.json();

    await connectDB();

    const notification = await Notification.findOneAndUpdate(
      { _id: params.id, recipient: session.user.id },
      {
        read: read !== undefined ? read : true,
        readAt: read !== undefined && read ? new Date() : null,
      },
      { new: true }
    )
      .populate("sender", "name username image")
      .populate("post", "content media")
      .lean();

    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const result = await Notification.deleteOne({
      _id: params.id,
      recipient: session.user.id,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
