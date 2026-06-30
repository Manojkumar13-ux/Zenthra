export const dynamic = 'force-dynamic';

// app/api/posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const body = await request.json();
    const { content, visibility, image, video, hashtags, category } = body;

    // ✅ Ensure category is properly set
    const finalCategory = category || "General";
    console.log("📂 Saving post with category:", finalCategory);

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
      category: finalCategory, // ✅ This is saved
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("posts").insertOne(post);
    const createdPost = { ...post, _id: result.insertedId };

    // Update hashtag counts
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