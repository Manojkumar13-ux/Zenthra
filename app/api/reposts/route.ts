// app/api/reposts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // FIXED: Import from lib/auth
import { connectDB } from "@/lib/db/connect";
import { Repost } from "@/lib/db/models/Repost";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";
import { Notification } from "@/lib/db/models/Notification";
import mongoose from "mongoose";

// ============================================
// GET /api/reposts - Check if user reposted a post
// ============================================
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ message: "Post ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: "Invalid post ID format" }, { status: 400 });
    }

    await connectDB();

    const [repost, count] = await Promise.all([
      Repost.findOne({ post: postId, user: session.user.id }),
      Repost.countDocuments({ post: postId }),
    ]);

    return NextResponse.json({
      isReposted: !!repost,
      repostId: repost?._id || null,
      repostsCount: count,
    });
  } catch (error) {
    console.error("GET /api/reposts error:", error);
    return NextResponse.json(
      { message: "Failed to get repost status", isReposted: false, repostsCount: 0 },
      { status: 200 }
    );
  }
}

// ============================================
// POST /api/reposts - Toggle repost
// ============================================
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ message: "Post ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: "Invalid post ID format" }, { status: 400 });
    }

    await connectDB();

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Check if user already reposted this post
    const existingRepost = await Repost.findOne({
      post: postId,
      user: session.user.id,
    });

    const userId = session.user.id;

    if (existingRepost) {
      // Remove repost (un-repost)
      await Repost.deleteOne({ _id: existingRepost._id });

      // Decrement repost count on post
      await Post.findByIdAndUpdate(postId, {
        $inc: { repostsCount: -1 },
      });

      // Remove repost from user's reposts array (if it exists in your User model)
      await User.findByIdAndUpdate(userId, {
        $pull: { reposts: postId },
      }).catch(() => {}); // Ignore if field doesn't exist

      // Remove notification for repost
      await Notification.deleteOne({
        recipient: post.author,
        sender: userId,
        type: "repost",
        post: postId,
      }).catch(() => {}); // Ignore if notification doesn't exist

      return NextResponse.json({
        message: "Repost removed",
        reposted: false,
        repostsCount: Math.max(0, (post.repostsCount || 0) - 1),
      });
    } else {
      // Check if user is trying to repost their own post
      if (post.author.toString() === userId) {
        return NextResponse.json({ message: "You cannot repost your own post" }, { status: 400 });
      }

      // Create new repost
      const repost = await Repost.create({
        post: postId,
        user: userId,
      });

      // Increment repost count on post
      await Post.findByIdAndUpdate(postId, {
        $inc: { repostsCount: 1 },
      });

      // Add repost to user's reposts array
      await User.findByIdAndUpdate(userId, {
        $push: { reposts: postId },
      }).catch(() => {}); // Ignore if field doesn't exist

      // Create notification for post author
      const sender = await User.findById(userId);
      await Notification.create({
        recipient: post.author,
        sender: userId,
        type: "repost",
        content: `${sender?.name || "Someone"} reposted your post`,
        post: postId,
        read: false,
      });

      return NextResponse.json(
        {
          message: "Post reposted successfully",
          reposted: true,
          repostsCount: (post.repostsCount || 0) + 1,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("POST /api/reposts error:", error);
    return NextResponse.json(
      {
        message: "Failed to process repost",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/reposts?postId=xxx - Remove a repost
// ============================================
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json({ message: "Post ID is required" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ message: "Invalid post ID format" }, { status: 400 });
    }

    await connectDB();

    // Find the repost
    const repost = await Repost.findOne({
      post: postId,
      user: session.user.id,
    });

    if (!repost) {
      return NextResponse.json({ message: "Repost not found" }, { status: 404 });
    }

    // Get post to update counts
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    // Delete the repost
    await Repost.deleteOne({ _id: repost._id });

    // Decrement repost count on post
    await Post.findByIdAndUpdate(postId, {
      $inc: { repostsCount: -1 },
    });

    // Remove repost from user's reposts array
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { reposts: postId },
    }).catch(() => {});

    // Remove notification for repost
    await Notification.deleteOne({
      recipient: post.author,
      sender: session.user.id,
      type: "repost",
      post: postId,
    }).catch(() => {});

    return NextResponse.json({
      message: "Repost removed successfully",
      reposted: false,
      repostsCount: Math.max(0, (post.repostsCount || 0) - 1),
    });
  } catch (error) {
    console.error("DELETE /api/reposts error:", error);
    return NextResponse.json({ message: "Failed to remove repost" }, { status: 500 });
  }
}
