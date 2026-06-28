// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";

// ============================================
// GET /api/posts/[id] - Get a single post
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const post = await Post.findOne({
      _id: params.id,
      isDeleted: { $ne: true } // Only get non-deleted posts
    })
      .populate("author", "name username image verified")
      .lean();

    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Check if current user liked/bookmarked/reposted
    const userId = session.user.id;
    const postWithStatus = {
      ...post,
      liked: post.likes?.some((id: any) => id.toString() === userId) || false,
      bookmarked: post.bookmarks?.some((id: any) => id.toString() === userId) || false,
      reposted: post.reposts?.some((id: any) => id.toString() === userId) || false,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      repostsCount: post.reposts?.length || 0,
    };

    // Increment view count
    await Post.findByIdAndUpdate(params.id, {
      $inc: { viewsCount: 1 }
    });

    return NextResponse.json({ post: postWithStatus });

  } catch (error) {
    console.error("GET /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/posts/[id] - Soft delete a post
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const post = await Post.findById(params.id);
    
    if (!post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "You don't have permission to delete this post" },
        { status: 403 }
      );
    }

    // Soft delete
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });

  } catch (error) {
    console.error("DELETE /api/posts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}