// app/api/posts/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase, isValidObjectId } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const postId = params.id;

    if (!postId || !isValidObjectId(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const comments = await db.collection("comments")
      .find({ postId: postId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await connectToDatabase();
    const postId = params.id;

    if (!postId || !isValidObjectId(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 });
    }

    const comment = {
      content: content.trim(),
      postId: postId,
      author: {
        id: session.user.id,
        name: session.user.name,
        username: session.user.username || session.user.email?.split("@")[0],
        image: session.user.image || null,
      },
      likes: 0,
      createdAt: new Date(),
    };

    const result = await db.collection("comments").insertOne(comment);
    const createdComment = { ...comment, _id: result.insertedId };

    // Update post comment count
    await db.collection("posts").updateOne(
      { _id: new ObjectId(postId) },
      { $inc: { comments: 1 } }
    );

    return NextResponse.json({ comment: createdComment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}