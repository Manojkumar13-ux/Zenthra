// app/api/users/[id]/follow/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const userId = session.user.id;
    const targetUserId = params.id;

    if (userId === targetUserId) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "follow";

    const currentUser = await User.findById(userId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (action === "follow") {
      // Check if already following
      if (currentUser.following && currentUser.following.includes(targetUserId)) {
        return NextResponse.json(
          { error: "Already following this user", isFollowing: true },
          { status: 400 }
        );
      }

      // Add to following/followers
      if (!currentUser.following) currentUser.following = [];
      if (!targetUser.followers) targetUser.followers = [];
      
      currentUser.following.push(targetUserId);
      targetUser.followers.push(userId);

      await currentUser.save();
      await targetUser.save();

      return NextResponse.json({
        success: true,
        isFollowing: true,
        message: "Followed successfully",
      });
    } else if (action === "unfollow") {
      // Remove from following/followers
      currentUser.following = currentUser.following.filter(
        (id: any) => id.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (id: any) => id.toString() !== userId
      );

      await currentUser.save();
      await targetUser.save();

      return NextResponse.json({
        success: true,
        isFollowing: false,
        message: "Unfollowed successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Follow API Error:", error);
    return NextResponse.json(
      { error: "Failed to update follow status" },
      { status: 500 }
    );
  }
}