// components/communities/[communityId]/join/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ Fixed import
import { connectDB } from "@/lib/db/connect";
import { Community } from "@/lib/db/models/Community";
import mongoose from "mongoose";

export async function POST(
  req: Request,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { communityId } = params;

    if (!communityId || !mongoose.Types.ObjectId.isValid(communityId)) {
      return NextResponse.json(
        { error: "Invalid community ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const community = await Community.findById(communityId);

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const userId = session.user.id;

    // Check if user is already a member
    const communityData = community as any;
    const isMember = communityData.members?.includes(userId) || false;

    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this community" },
        { status: 400 }
      );
    }

    // Check if community is private
    if (communityData.isPrivate) {
      // For private communities, you might want to add a pending request system
      // For now, we'll just return an error
      return NextResponse.json(
        { error: "This community is private. You need an invitation to join." },
        { status: 403 }
      );
    }

    // Add user to community
    communityData.members.push(userId);
    await communityData.save();

    return NextResponse.json({
      success: true,
      message: "Successfully joined the community",
      isMember: true,
    });
  } catch (error) {
    console.error("Error joining community:", error);
    return NextResponse.json(
      { 
        error: "Failed to join community",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { communityId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { communityId } = params;

    if (!communityId || !mongoose.Types.ObjectId.isValid(communityId)) {
      return NextResponse.json(
        { error: "Invalid community ID" },
        { status: 400 }
      );
    }

    await connectDB();

    const community = await Community.findById(communityId);

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const userId = session.user.id;
    const communityData = community as any;

    // Check if user is a member
    const isMember = communityData.members?.includes(userId) || false;

    if (!isMember) {
      return NextResponse.json(
        { error: "You are not a member of this community" },
        { status: 400 }
      );
    }

    // Remove user from community
    communityData.members = communityData.members.filter(
      (id: string) => id.toString() !== userId
    );

    // If user is an admin, remove them from admins as well
    if (communityData.admins?.includes(userId)) {
      communityData.admins = communityData.admins.filter(
        (id: string) => id.toString() !== userId
      );
    }

    await communityData.save();

    return NextResponse.json({
      success: true,
      message: "Successfully left the community",
      isMember: false,
    });
  } catch (error) {
    console.error("Error leaving community:", error);
    return NextResponse.json(
      { 
        error: "Failed to leave community",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}