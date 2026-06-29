// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ Fixed import
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const post = await Post.findById(params.id)
      .populate("author", "name username image bio")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name username image",
        },
      })
      .lean();

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if current user has liked the post
    const isLiked = post.likes?.includes(session.user.id) || false;
    const isBookmarked = post.bookmarks?.includes(session.user.id) || false;
    const isReposted = post.reposts?.includes(session.user.id) || false;

    const formattedPost = {
      ...post,
      _id: post._id.toString(),
      author: post.author
        ? {
            ...post.author,
            _id: post.author._id.toString(),
          }
        : null,
      comments:
        post.comments?.map((comment: any) => ({
          ...comment,
          _id: comment._id.toString(),
          author: comment.author
            ? {
                ...comment.author,
                _id: comment.author._id.toString(),
              }
            : null,
        })) || [],
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      repostsCount: post.reposts?.length || 0,
      isLiked,
      isBookmarked,
      isReposted,
      createdAt: post.createdAt?.toISOString(),
      updatedAt: post.updatedAt?.toISOString(),
    };

    // Increment view count
    await Post.findByIdAndUpdate(params.id, {
      $inc: { viewsCount: 1 },
    });

    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, media, hashtags, category, mood, visibility } = await req.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(params.id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user is the author
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to edit this post" },
        { status: 403 }
      );
    }

    // Extract hashtags from content
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    const extractedHashtags = matches
      ? matches.map((tag: string) => tag.slice(1).toLowerCase())
      : [];

    const allHashtags = [...new Set([...(hashtags || []), ...extractedHashtags])];

    // Update post
    const updatedPost = await Post.findByIdAndUpdate(
      params.id,
      {
        content: content.trim(),
        media: media || [],
        hashtags: allHashtags,
        category: category || "general",
        mood: mood || null,
        visibility: visibility || "public",
        isEdited: true,
        editedAt: new Date(),
      },
      { new: true }
    )
      .populate("author", "name username image")
      .lean();

    return NextResponse.json({
      success: true,
      post: {
        ...updatedPost,
        _id: updatedPost._id.toString(),
        author: updatedPost.author
          ? {
              ...updatedPost.author,
              _id: updatedPost.author._id.toString(),
            }
          : null,
        createdAt: updatedPost.createdAt?.toISOString(),
        updatedAt: updatedPost.updatedAt?.toISOString(),
      },
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const post = await Post.findById(params.id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user is the author or admin
    const isAuthor = post.author.toString() === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to delete this post" },
        { status: 403 }
      );
    }

    // Delete post
    await Post.findByIdAndDelete(params.id);

    // Update user's post count
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { postsCount: -1 },
    });

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
