// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const db = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const hashtag = searchParams.get("hashtag");
    const limit = parseInt(searchParams.get("limit") || "50");
    const userId = searchParams.get("userId");

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
      .limit(limit)
      .toArray();

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const body = await request.json();
    const { content, visibility, image, video, hashtags, category } = body;

    const post = {
      content,
      image: image || null,
      video: video || null,
      author: {
        id: session.user.id,
        name: session.user.name,
        username: session.user.username || session.user.email?.split("@")[0],
        image: session.user.image || null,
      },
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      visibility: visibility || "everyone",
      hashtags: hashtags || [],
      category: category || "General",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("posts").insertOne(post);
    const createdPost = { ...post, _id: result.insertedId };

    if (hashtags && hashtags.length > 0) {
      for (const tag of hashtags) {
        await db.collection("hashtags").updateOne(
          { tag: tag.toLowerCase() },
          { 
            $inc: { count: 1 },
            $addToSet: { posts: result.insertedId },
            $set: { lastUsed: new Date(), isTrending: true }
          },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({ post: createdPost, message: "Post created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}