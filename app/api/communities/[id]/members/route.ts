import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Community } from "@/lib/db/models/Community";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();
    const userId = session.user.id;

    if (!["join", "leave"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'join' or 'leave'" },
        { status: 400 }
      );
    }

    await connectDB();

    const community = await Community.findById(params.id);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Convert to strings for comparison
    const memberIds = community.members?.map((id: any) => id.toString()) || [];
    const isMember = memberIds.includes(userId);

    if (action === "join") {
      if (isMember) {
        return NextResponse.json({ message: "Already a member" }, { status: 400 });
      }

      // Add to members
      community.members.push(userId);

      // Create notification for owner
      try {
        const user = await fetch(`${process.env.NEXTAUTH_URL}/api/users/me`, {
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        const userData = await user.json();

        await fetch(`${process.env.NEXTAUTH_URL}/api/notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userId: community.owner.toString(),
            type: "community",
            message: `${userData.name || "Someone"} joined your community "${community.name}"`,
            communityId: community._id.toString(),
          }),
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }
    } else {
      // Leave
      if (!isMember) {
        return NextResponse.json({ message: "Not a member" }, { status: 400 });
      }

      // Remove from members
      community.members = community.members.filter((id: any) => id.toString() !== userId);

      // Remove from moderators if present
      if (community.moderators) {
        community.moderators = community.moderators.filter((id: any) => id.toString() !== userId);
      }
    }

    await community.save();

    return NextResponse.json({
      success: true,
      isMember: action === "join",
      memberCount: community.members?.length || 0,
    });
  } catch (error) {
    console.error("Error updating community membership:", error);
    return NextResponse.json({ error: "Failed to update membership" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const community = await Community.findById(params.id)
      .populate("members", "name username image")
      .populate("moderators", "name username image")
      .lean();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    return NextResponse.json({
      members: community.members || [],
      moderators: community.moderators || [],
      memberCount: community.members?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching community members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
