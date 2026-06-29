// app/api/likes/route.ts
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

export const dynamic = 'force-dynamic';
import { Post } from "@/lib/db/models/Post";

export const dynamic = 'force-dynamic';
import { Notification } from "@/lib/db/models/Notification";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    await connectDB();

    const userId = session.user.id;
    const post = await Post.findById(postId);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if already liked
    const likedBy = post.likes?.map((id: any) => id.toString()) || [];
    const isLiked = likedBy.includes(userId);

    let isLikedNow = false;

    if (isLiked) {
      // Unlike
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: userId },
      });
    } else {
      // Like
      await Post.findByIdAndUpdate(postId, {
        $addToSet: { likes: userId },
      });
      isLikedNow = true;

      // Create notification if not liking own post
      if (post.author.toString() !== userId) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: "like",
          content: `${session.user.name} liked your post`,
          post: postId,
          read: false,
        });
      }
    }

    const updatedPost = await Post.findById(postId);
    const likesCount = updatedPost?.likes?.length || 0;

    return NextResponse.json({
      success: true,
      isLiked: isLikedNow,
      likesCount: likesCount,
    });
  } catch (error) {
    console.error("Like API error:", error);
    return NextResponse.json({ error: "Failed to process like" }, { status: 500 });
  }
}
