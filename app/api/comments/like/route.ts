import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";

export const dynamic = 'force-dynamic';
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { connectDB } from "@/lib/db/connect";

export const dynamic = 'force-dynamic';
import { Comment } from "@/lib/db/models/Comment";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json({ message: "Comment ID is required" }, { status: 400 });
    }

    await connectDB();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    const userId = session.user.id;
    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      await Comment.findByIdAndUpdate(commentId, {
        $pull: { likes: userId },
      });
      return NextResponse.json({ liked: false });
    } else {
      await Comment.findByIdAndUpdate(commentId, {
        $push: { likes: userId },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("POST /api/comments/like error:", error);
    return NextResponse.json({ message: "Failed to like comment" }, { status: 500 });
  }
}
