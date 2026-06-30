// app/api/users/[id]/posts/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const userId = params.id;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const posts = await db.collection("posts")
      .find({ "author.id": userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    // Get user info for posts that might have missing author data
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { name: 1, username: 1, image: 1 } }
    );

    // Ensure each post has author data
    const postsWithAuthor = posts.map(post => ({
      ...post,
      author: post.author || {
        _id: userId,
        name: user?.name || "Unknown",
        username: user?.username || "user",
        image: user?.image || null,
      }
    }));

    return NextResponse.json({ posts: postsWithAuthor });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}