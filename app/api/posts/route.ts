// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";

// ============================================
// GET /api/posts - Get all posts
// ============================================
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Get posts that are NOT deleted
    const posts = await Post.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "name username image verified")
      .lean();

    console.log(`📊 GET /api/posts: Found ${posts.length} posts`);

    return NextResponse.json({ 
      success: true,
      posts,
      count: posts.length 
    });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// ============================================
// POST /api/posts - Create a new post
// ============================================
export async function POST(req: NextRequest) {
  try {
    console.log("📝 POST /api/posts started");
    
    const session = await getServerSession(authOptions);
    console.log("🔐 Session:", session?.user?.id);
    
    if (!session?.user?.id) {
      console.log("❌ No session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("📡 Connecting to database...");
    await connectDB();
    console.log("✅ Database connected");

    const body = await req.json();
    console.log("📦 Request body:", body);
    
    const { content, media, audience, mood, location, scheduledAt, communityId, poll } = body;

    if (!content?.trim() && (!media || media.length === 0)) {
      console.log("❌ No content or media");
      return NextResponse.json(
        { error: "Content or media is required" },
        { status: 400 }
      );
    }

    // Extract hashtags from content
    const hashtags = content.match(/#[\w]+/g) || [];
    const mentions = content.match(/@[\w]+/g) || [];
    console.log(`📝 Hashtags found:`, hashtags);

    // Build post data with correct field names from your model
    const postData = {
      content: content.trim(),
      author: session.user.id,
      media: media || [],
      hashtags: hashtags,
      mentions: mentions,
      audience: audience || "everyone",
      mood: mood || "neutral",
      location: location || "",
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      isDeleted: false,  // Your model uses isDeleted, not isPublished
      isScheduled: !!scheduledAt,
      isAnonymous: false,
      likes: [],
      comments: [],
      reposts: [],
      bookmarks: [],
      community: communityId || undefined,
      editHistory: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("📝 Creating post with data:", postData);

    // Create the post
    const post = await Post.create(postData);
    console.log("✅ Post created in DB:", post._id);
    
    // Populate author data for response
    await post.populate("author", "name username image verified");

    console.log(`✅ Post created successfully: ${post._id}`);

    return NextResponse.json({
      success: true,
      message: "Post created successfully",
      post,
    });

  } catch (error) {
    console.error("❌ POST /api/posts error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/posts - Soft delete a post
// ============================================
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const post = await Post.findById(postId);
    
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

    // Soft delete - set isDeleted to true
    post.isDeleted = true;
    post.deletedAt = new Date();
    await post.save();

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully",
    });

  } catch (error) {
    console.error("DELETE /api/posts error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}