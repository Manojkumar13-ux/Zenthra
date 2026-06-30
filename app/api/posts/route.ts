// app/api/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ✅ GET - Fetch all posts
export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const hashtag = searchParams.get("hashtag");
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    let query: any = {};

    if (category && category !== "all") {
      const categoryMap: Record<string, string> = {
        "movies": "Movies",
        "sports": "Sports",
        "technology": "Technology",
        "music": "Music",
        "gaming": "Gaming",
        "business": "Business",
        "education": "Education",
      };
      query.category = categoryMap[category] || category;
    }
    
    if (hashtag) {
      query.hashtags = hashtag.toLowerCase();
    }

    if (userId) {
      query["author.id"] = userId;
    }

    const posts = await db.collection("posts")
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await db.collection("posts").countDocuments(query);

    const serializedPosts = posts.map(post => ({
      ...post,
      _id: post._id.toString(),
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({ 
      posts: serializedPosts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts", posts: [] },
      { status: 500 }
    );
  }
}

// ✅ POST - Create a new post with automatic user creation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Session user:", session.user);

    const db = await connectToDatabase();
    const body = await request.json();
    const { content, visibility, image, video, hashtags, category, mood } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // ✅ Get or create user
    const userId = session.user.id;
    let user = null;
    
    console.log(`🔍 Looking for user with ID: ${userId}`);

    // ✅ FIX: Try to find user by ObjectId first
    try {
      if (ObjectId.isValid(userId)) {
        user = await db.collection("users").findOne({ 
          _id: new ObjectId(userId) 
        });
        console.log(`🔍 Found by ObjectId: ${!!user}`);
      }
    } catch (error) {
      console.warn("⚠️ Error finding by ObjectId:", error);
    }

    // ✅ If not found, try finding by string ID
    if (!user) {
      try {
        user = await db.collection("users").findOne({ 
          _id: userId as any 
        });
        console.log(`🔍 Found by string ID: ${!!user}`);
      } catch (error) {
        console.warn("⚠️ Error finding by string ID:", error);
      }
    }
    
    // ✅ Try finding by email
    if (!user && session.user.email) {
      user = await db.collection("users").findOne({ 
        email: session.user.email 
      });
      console.log(`🔍 Found by email: ${!!user}`);
    }
    
    // ✅ Try finding by username
    if (!user && session.user.username) {
      user = await db.collection("users").findOne({ 
        username: session.user.username 
      });
      console.log(`🔍 Found by username: ${!!user}`);
    }

    // ✅ If no user found, create one
    if (!user) {
      console.warn("⚠️ User not found, creating new user...");
      
      const newUser = {
        _id: new ObjectId(),
        name: session.user.name || "User",
        email: session.user.email || `user_${Date.now()}@temp.com`,
        username: session.user.username || `user_${Date.now()}`,
        image: session.user.image || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      await db.collection("users").insertOne(newUser);
      user = newUser;
      console.log(`✅ Created new user with ID: ${user._id}`);
    }

    // ✅ Create post with user data
    const post = {
      content: content.trim(),
      image: image || null,
      video: video || null,
      author: {
        id: user._id.toString(),
        name: user.name || session.user.name || "Unknown User",
        username: user.username || session.user.username || "user",
        image: user.image || session.user.image || null,
      },
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      visibility: visibility || "everyone",
      mood: mood || "neutral",
      hashtags: hashtags || [],
      category: category || "General",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("posts").insertOne(post);
    
    const createdPost = { 
      ...post, 
      _id: result.insertedId.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };

    // ✅ Update hashtag counts
    if (hashtags && hashtags.length > 0) {
      for (const tag of hashtags) {
        await db.collection("hashtags").updateOne(
          { tag: tag.toLowerCase() },
          { 
            $inc: { count: 1 },
            $addToSet: { posts: result.insertedId },
            $set: { 
              lastUsed: new Date(),
              isTrending: true 
            }
          },
          { upsert: true }
        );
      }
    }

    console.log("✅ Post created successfully:", createdPost._id);

    return NextResponse.json({ 
      post: createdPost,
      message: "Post created successfully" 
    }, { status: 201 });
    
  } catch (error) {
    console.error("❌ Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post: " + (error as Error).message },
      { status: 500 }
    );
  }
}