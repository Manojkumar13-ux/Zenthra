// app/api/hashtags/trending/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Hashtag } from "@/lib/db/models/Hashtag";

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get top trending hashtags by count
    const hashtags = await Hashtag.find({ count: { $gt: 0 } })
      .sort({ count: -1, lastUsed: -1 })
      .limit(limit)
      .lean();

    // Format the response
    const formattedHashtags = hashtags.map((tag: any) => ({
      id: tag._id.toString(),
      tag: tag.tag,
      count: tag.count,
      isActive: tag.isTrending || tag.count > 3,
      lastUsed: tag.lastUsed,
    }));

    return NextResponse.json({ hashtags: formattedHashtags });
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending hashtags", hashtags: [] },
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

    await connectDB();

    const body = await req.json();
    const { tag, postId } = body;

    if (!tag) {
      return NextResponse.json(
        { error: "Tag is required" },
        { status: 400 }
      );
    }

    const cleanTag = tag.toLowerCase().trim().replace(/\s/g, "");

    // Find and update or create hashtag
    const hashtag = await Hashtag.findOneAndUpdate(
      { tag: cleanTag },
      { 
        $inc: { count: 1 },
        $addToSet: { posts: postId },
        $set: { lastUsed: new Date() }
      },
      { upsert: true, new: true }
    );

    // Check if it should be trending (count > 3)
    if (hashtag.count > 3) {
      await Hashtag.updateOne(
        { _id: hashtag._id },
        { $set: { isTrending: true } }
      );
    }

    return NextResponse.json({ 
      hashtag: {
        id: hashtag._id.toString(),
        tag: hashtag.tag,
        count: hashtag.count,
        isActive: hashtag.isTrending || hashtag.count > 3,
      },
      message: "Hashtag updated successfully" 
    });
  } catch (error) {
    console.error("Error updating hashtag:", error);
    return NextResponse.json(
      { error: "Failed to update hashtag" },
      { status: 500 }
    );
  }
}