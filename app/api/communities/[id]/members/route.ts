// app/api/communities/[id]/members/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Community } from "@/lib/db/models/Community";
import { User } from "@/lib/db/models/User";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const community = await Community.findById(params.id)
      .populate("members", "name username image bio")
      .populate("admins", "name username image bio")
      .lean();

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Check if user is a member - using type assertion
    const communityData = community as any;
    const members = communityData.members || [];
    const admins = communityData.admins || [];

    const isMember = members.some(
      (member: any) => member._id.toString() === session.user.id
    ) || false;

    if (!isMember && communityData.isPrivate) {
      return NextResponse.json(
        { error: "This community is private" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      members: members,
      admins: admins,
      memberCount: members.length || 0,
      adminCount: admins.length || 0,
      isMember,
      isAdmin: admins.some(
        (admin: any) => admin._id.toString() === session.user.id
      ) || false,
    });
  } catch (error) {
    console.error("Error fetching community members:", error);
    return NextResponse.json(
      { error: "Failed to fetch community members" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action } = body;

    if (!action || !["join", "leave"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'join' or 'leave'" },
        { status: 400 }
      );
    }

    await connectDB();

    const community = await Community.findById(params.id);

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const userId = session.user.id;
    const communityData = community as any;
    const isMember = communityData.members?.includes(userId) || false;

    if (action === "join") {
      if (isMember) {
        return NextResponse.json(
          { error: "You are already a member" },
          { status: 400 }
        );
      }

      // Add user to members
      communityData.members.push(userId);
      await communityData.save();

      return NextResponse.json({
        success: true,
        message: "Joined community successfully",
        isMember: true,
      });
    }

    if (action === "leave") {
      if (!isMember) {
        return NextResponse.json(
          { error: "You are not a member of this community" },
          { status: 400 }
        );
      }

      // Remove user from members
      communityData.members = communityData.members.filter(
        (id: string) => id.toString() !== userId
      );

      // Remove from admins if they were an admin
      if (communityData.admins?.includes(userId)) {
        communityData.admins = communityData.admins.filter(
          (id: string) => id.toString() !== userId
        );
      }

      await communityData.save();

      return NextResponse.json({
        success: true,
        message: "Left community successfully",
        isMember: false,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating community membership:", error);
    return NextResponse.json(
      { error: "Failed to update community membership" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action || !["add_admin", "remove_admin"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid request. Requires userId and action" },
        { status: 400 }
      );
    }

    await connectDB();

    const community = await Community.findById(params.id);

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const communityData = community as any;

    // Check if current user is an admin
    if (!communityData.admins?.includes(session.user.id)) {
      return NextResponse.json(
        { error: "Only admins can manage moderators" },
        { status: 403 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is a member
    if (!communityData.members?.includes(userId)) {
      return NextResponse.json(
        { error: "User is not a member of this community" },
        { status: 400 }
      );
    }

    if (action === "add_admin") {
      if (communityData.admins?.includes(userId)) {
        return NextResponse.json(
          { error: "User is already an admin" },
          { status: 400 }
        );
      }

      communityData.admins.push(userId);
      await communityData.save();

      return NextResponse.json({
        success: true,
        message: "User added as admin successfully",
        isAdmin: true,
      });
    }

    if (action === "remove_admin") {
      if (!communityData.admins?.includes(userId)) {
        return NextResponse.json(
          { error: "User is not an admin" },
          { status: 400 }
        );
      }

      // Prevent removing the last admin
      if (communityData.admins.length <= 1) {
        return NextResponse.json(
          { error: "Cannot remove the last admin" },
          { status: 400 }
        );
      }

      communityData.admins = communityData.admins.filter(
        (id: string) => id.toString() !== userId
      );
      await communityData.save();

      return NextResponse.json({
        success: true,
        message: "Admin privileges removed successfully",
        isAdmin: false,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating community admins:", error);
    return NextResponse.json(
      { error: "Failed to update community admins" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const community = await Community.findById(params.id);

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const communityData = community as any;

    // Check if current user is an admin or the user themselves
    const isAdmin = communityData.admins?.includes(session.user.id) || false;
    const isSelf = session.user.id === userId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: "Unauthorized to remove this user" },
        { status: 403 }
      );
    }

    // Cannot remove the last admin
    if (isAdmin && communityData.admins?.includes(userId) && communityData.admins.length <= 1) {
      return NextResponse.json(
        { error: "Cannot remove the last admin" },
        { status: 400 }
      );
    }

    // Remove user from members
    communityData.members = communityData.members.filter(
      (id: string) => id.toString() !== userId
    );

    // Remove from admins if they were an admin
    if (communityData.admins?.includes(userId)) {
      communityData.admins = communityData.admins.filter(
        (id: string) => id.toString() !== userId
      );
    }

    await communityData.save();

    return NextResponse.json({
      success: true,
      message: "User removed from community successfully",
    });
  } catch (error) {
    console.error("Error removing user from community:", error);
    return NextResponse.json(
      { error: "Failed to remove user from community" },
      { status: 500 }
    );
  }
}