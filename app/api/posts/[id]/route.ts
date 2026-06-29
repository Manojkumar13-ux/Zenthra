// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";
import { Comment } from "@/lib/db/models/Comment";
import { Like } from "@/lib/db/models/Like";
import { Repost } from "@/lib/db/models/Repost";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // Type assertion to handle the post data
    const postData = post as any;

    // Check if current user has liked, bookmarked, or reposted the post
    const isLiked = postData.likes?.includes(session.user.id) || false;
    const isBookmarked = postData.bookmarks?.includes(session.user.id) || false;
    const isReposted = postData.reposts?.includes(session.user.id) || false;

    const formattedPost = {
      _id: postData._id.toString(),
      content: postData.content,
      author: postData.author ? {
        _id: postData.author._id.toString(),
        name: postData.author.name,
        username: postData.author.username,
        image: postData.author.image,
        bio: postData.author.bio,
      } : null,
      comments: postData.comments?.map((comment: any) => ({
        _id: comment._id.toString(),
        content: comment.content,
        author: comment.author ? {
          _id: comment.author._id.toString(),
          name: comment.author.name,
          username: comment.author.username,
          image: comment.author.image,
        } : null,
        createdAt: comment.createdAt?.toISOString(),
        updatedAt: comment.updatedAt?.toISOString(),
      })) || [],
      likesCount: postData.likes?.length || 0,
      commentsCount: postData.comments?.length || 0,
      repostsCount: postData.reposts?.length || 0,
      viewsCount: postData.viewsCount || 0,
      hashtags: postData.hashtags || [],
      media: postData.media || [],
      mood: postData.mood || null,
      category: postData.category || "general",
      isPinned: postData.isPinned || false,
      isLiked,
      isBookmarked,
      isReposted,
      createdAt: postData.createdAt?.toISOString(),
      updatedAt: postData.updatedAt?.toISOString(),
    };

    // Increment view count (do this asynchronously, don't wait)
    try {
      await Post.findByIdAndUpdate(params.id, {
        $inc: { viewsCount: 1 },
      });
    } catch (viewError) {
      console.error("Error incrementing view count:", viewError);
    }

    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { content, media, hashtags, category, mood, visibility } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
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

    if (!updatedPost) {
      return NextResponse.json(
        { error: "Failed to update post" },
        { status: 500 }
      );
    }

    const updatedPostData = updatedPost as any;

    return NextResponse.json({
      success: true,
      post: {
        _id: updatedPostData._id.toString(),
        content: updatedPostData.content,
        author: updatedPostData.author ? {
          _id: updatedPostData.author._id.toString(),
          name: updatedPostData.author.name,
          username: updatedPostData.author.username,
          image: updatedPostData.author.image,
        } : null,
        likesCount: updatedPostData.likes?.length || 0,
        commentsCount: updatedPostData.comments?.length || 0,
        repostsCount: updatedPostData.reposts?.length || 0,
        hashtags: updatedPostData.hashtags || [],
        media: updatedPostData.media || [],
        category: updatedPostData.category || "general",
        mood: updatedPostData.mood || null,
        isEdited: updatedPostData.isEdited || false,
        createdAt: updatedPostData.createdAt?.toISOString(),
        updatedAt: updatedPostData.updatedAt?.toISOString(),
      },
      message: "Post updated successfully",
    });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
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

    // Check if user is the author or admin
    const isAuthor = post.author.toString() === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to delete this post" },
        { status: 403 }
      );
    }

    // Delete related data
    const postId = params.id;
    
    // Delete likes
    await Like.deleteMany({ post: postId });
    
    // Delete reposts
    await Repost.deleteMany({ post: postId });
    
    // Delete comments
    await Comment.deleteMany({ post: postId });
    
    // Delete the post
    await Post.findByIdAndDelete(postId);

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
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}