// app/api/test/create-posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";

export async function GET() {
  try {
    console.log("🔵 Creating test posts...");

    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("🔴 No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🟢 User: ${session.user.id}`);

    await connectDB();
    console.log("✅ Database connected");

    // Check existing posts
    const existingCount = await Post.countDocuments({ author: session.user.id });
    console.log(`📊 Existing posts: ${existingCount}`);

    if (existingCount > 0) {
      const posts = await Post.find({ author: session.user.id })
        .populate("author", "name username image")
        .sort({ createdAt: -1 })
        .lean();

      const formattedPosts = posts.map((post: any) => ({
        ...post,
        _id: post._id.toString(),
        author: post.author
          ? {
              ...post.author,
              _id: post.author._id.toString(),
            }
          : null,
        createdAt: post.createdAt?.toISOString(),
      }));

      return NextResponse.json({
        success: true,
        message: `You already have ${existingCount} posts!`,
        count: existingCount,
        posts: formattedPosts,
      });
    }

    // Create test posts
    const testPosts = [
      {
        content: "Welcome to Zenthra! 🎉 This is my first post on the platform. #welcome #zenthra",
        author: session.user.id,
        hashtags: ["welcome", "zenthra"],
        isPublic: true,
      },
      {
        content: "Just joined this amazing community! #zenthra #social #community",
        author: session.user.id,
        hashtags: ["zenthra", "social", "community"],
        isPublic: true,
      },
      {
        content:
          "What's on your mind today? Share your thoughts with the community! 💭 #thoughts #community",
        author: session.user.id,
        hashtags: ["thoughts", "community"],
        isPublic: true,
      },
      {
        content:
          "This is a test post with #movie hashtag. Check if it appears in movie category! #movie #test",
        author: session.user.id,
        hashtags: ["movie", "test"],
        isPublic: true,
      },
      {
        content:
          "I love watching #movies and #sports! What are your favorite hobbies? #entertainment",
        author: session.user.id,
        hashtags: ["movies", "sports", "entertainment"],
        isPublic: true,
      },
    ];

    const result = await Post.insertMany(testPosts);
    console.log(`✅ Created ${result.length} test posts`);

    const posts = await Post.find({ author: session.user.id })
      .populate("author", "name username image")
      .sort({ createdAt: -1 })
      .lean();

    const formattedPosts = posts.map((post: any) => ({
      ...post,
      _id: post._id.toString(),
      author: post.author
        ? {
            ...post.author,
            _id: post.author._id.toString(),
          }
        : null,
      createdAt: post.createdAt?.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      count: result.length,
      posts: formattedPosts,
      message: `${result.length} test posts created successfully! 🎉`,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create test posts",
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500 }
    );
  }
}
