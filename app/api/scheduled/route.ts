import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import mongoose from "mongoose";

// Define ScheduledPost model if it doesn't exist
const ScheduledPostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  media: { type: [String], default: [] },
  scheduledAt: { type: Date, required: true },
  published: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const ScheduledPost = mongoose.models.ScheduledPost || mongoose.model("ScheduledPost", ScheduledPostSchema);

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const scheduledPosts = await ScheduledPost.find({ 
      user: session.user.id,
      published: false,
      scheduledAt: { $gte: new Date() }
    })
    .sort({ scheduledAt: 1 })
    .lean();

    return NextResponse.json(scheduledPosts);
  } catch (error) {
    console.error("Error fetching scheduled posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { content, scheduledAt, media } = body;

    if (!content || !scheduledAt) {
      return NextResponse.json(
        { error: "Content and scheduledAt are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const scheduledPost = new ScheduledPost({
      user: session.user.id,
      content,
      scheduledAt: new Date(scheduledAt),
      media: media || [],
    });

    await scheduledPost.save();

    return NextResponse.json(scheduledPost, { status: 201 });
  } catch (error) {
    console.error("Error creating scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to create scheduled post" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const result = await ScheduledPost.findOneAndDelete({
      _id: id,
      user: session.user.id,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scheduled post:", error);
    return NextResponse.json(
      { error: "Failed to delete scheduled post" },
      { status: 500 }
    );
  }
}