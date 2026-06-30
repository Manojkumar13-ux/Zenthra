// app/api/posts/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase, isValidObjectId } from "@/lib/mongodb"; // ✅ Changed
import { ObjectId } from "mongodb";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const db = await connectToDatabase();
    const objectId = new ObjectId(id);
    
    const post = await db.collection("posts").findOne({ _id: objectId });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.author.id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Decrease hashtag counts
    if (post.hashtags && post.hashtags.length > 0) {
      for (const tag of post.hashtags) {
        await db.collection("hashtags").updateOne(
          { tag: tag.toLowerCase() },
          { $inc: { count: -1 } }
        );
      }
    }

    await db.collection("posts").deleteOne({ _id: objectId });

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}