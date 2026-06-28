// app/api/users/[userId]/follow/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { User } from "@/lib/db/models/User";
import { Notification } from "@/lib/db/models/Notification";
import mongoose from "mongoose";

// ============================================
// POST /api/users/[userId]/follow?action=follow|unfollow
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    console.log("🔵 Follow API: Starting request");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log("🔴 Follow API: Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "follow";

    console.log(`📊 Follow API: User ${session.user.id} ${action} User ${userId}`);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log("🔴 Follow API: Invalid user ID");
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const currentUserId = session.user.id;
    const targetUserId = userId;

    // Prevent self-follow
    if (currentUserId === targetUserId) {
      console.log("🔴 Follow API: Cannot follow self");
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Get current user and target user
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
      console.log("🔴 Follow API: User not found");
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Convert following array to strings for comparison
    const following = currentUser.following?.map((id: any) => id.toString()) || [];
    const isFollowing = following.includes(targetUserId);

    console.log(`📊 Follow API: isFollowing = ${isFollowing}`);

    // ============ FOLLOW ============
    if (action === "follow") {
      if (isFollowing) {
        console.log("🔴 Follow API: Already following");
        return NextResponse.json(
          { 
            error: "Already following this user",
            isFollowing: true 
          },
          { status: 400 }
        );
      }

      // Add to following/followers
      await Promise.all([
        User.findByIdAndUpdate(currentUserId, {
          $addToSet: { following: targetUserId }
        }),
        User.findByIdAndUpdate(targetUserId, {
          $addToSet: { followers: currentUserId }
        })
      ]);

      // Create notification for follow
      await Notification.create({
        recipient: targetUserId,
        sender: currentUserId,
        type: "follow",
        content: `${currentUser.name} started following you`,
        read: false,
      });

      console.log(`✅ Follow API: ${currentUser.name} now follows ${targetUser.name}`);

      return NextResponse.json({
        success: true,
        message: `You are now following ${targetUser.name}`,
        isFollowing: true
      });
    }

    // ============ UNFOLLOW ============
    if (action === "unfollow") {
      if (!isFollowing) {
        console.log("🔴 Follow API: Not following");
        return NextResponse.json(
          { 
            error: "You are not following this user",
            isFollowing: false 
          },
          { status: 400 }
        );
      }

      // Remove from following/followers
      await Promise.all([
        User.findByIdAndUpdate(currentUserId, {
          $pull: { following: targetUserId }
        }),
        User.findByIdAndUpdate(targetUserId, {
          $pull: { followers: currentUserId }
        })
      ]);

      console.log(`✅ Follow API: ${currentUser.name} unfollowed ${targetUser.name}`);

      return NextResponse.json({
        success: true,
        message: `You have unfollowed ${targetUser.name}`,
        isFollowing: false
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Use 'follow' or 'unfollow'" },
      { status: 400 }
    );

  } catch (error) {
    console.error("❌ Follow API error:", error);
    return NextResponse.json(
      { error: "Failed to process follow request" },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/users/[userId]/follow - Check if following
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const currentUser = await User.findById(session.user.id);
    const following = currentUser?.following?.map((id: any) => id.toString()) || [];
    const isFollowing = following.includes(userId);

    return NextResponse.json({
      isFollowing
    });

  } catch (error) {
    console.error("Check follow error:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}