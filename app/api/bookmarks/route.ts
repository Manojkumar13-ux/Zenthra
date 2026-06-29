import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).populate({
      path: "bookmarks",
      populate: { path: "author", select: "name username image" },
    });

    return NextResponse.json({ posts: user?.bookmarks || [] });
  } catch (error) {
    console.error("GET /api/bookmarks error:", error);
    return NextResponse.json({ posts: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await req.json();
    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const isBookmarked = user.bookmarks.includes(postId);

    if (isBookmarked) {
      user.bookmarks = user.bookmarks.filter((id: any) => id.toString() !== postId);
    } else {
      user.bookmarks.push(postId);
    }

    await user.save();

    return NextResponse.json({ bookmarked: !isBookmarked });
  } catch (error) {
    console.error("POST /api/bookmarks error:", error);
    return NextResponse.json({ message: "Failed to toggle bookmark" }, { status: 500 });
  }
}
