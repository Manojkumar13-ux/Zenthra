// app/api/comments/route.ts (POST method only)
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

export const dynamic = 'force-dynamic';
import { Comment } from "@/lib/db/models/Comment";

export const dynamic = 'force-dynamic';
import { Post } from "@/lib/db/models/Post";

export const dynamic = 'force-dynamic';
import { Notification } from "@/lib/db/models/Notification";

export const dynamic = 'force-dynamic';
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// POST /api/comments - Create a new comment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId, content, parentId } = body;

    if (!postId || !mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await connectDB();

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const commentData: any = {
      content: content.trim(),
      author: session.user.id,
      post: postId,
      likes: [],
      isDeleted: false,
    };

    if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
      commentData.parent = parentId;
    }

    const comment = await Comment.create(commentData);

    // Update post comment count
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentsCount: 1 },
    });

    await comment.populate("author", "name username image");

    // Create notification for post owner (if not commenting on own post)
    if (post.author.toString() !== session.user.id) {
      await Notification.create({
        recipient: post.author,
        sender: session.user.id,
        type: "comment",
        content: `${session.user.name} commented on your post`,
        post: postId,
        comment: comment._id,
        read: false,
      });
    }

    // If replying to a comment, notify the parent comment author
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (parentComment && parentComment.author.toString() !== session.user.id) {
        await Notification.create({
          recipient: parentComment.author,
          sender: session.user.id,
          type: "comment",
          content: `${session.user.name} replied to your comment`,
          post: postId,
          comment: comment._id,
          read: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error("POST /api/comments error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
