import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/route";
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const communityId = params.communityId;
    const userId = session.user.id;

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return NextResponse.json({ message: "Invalid community ID" }, { status: 400 });
    }

    await connectDB();

    const community = await Community.findById(communityId);
    if (!community) {
      return NextResponse.json({ message: "Community not found" }, { status: 404 });
    }

    const isMember = community.members.some(
      (id: any) => id.toString() === userId
    );

    if (isMember) {
      // Leave community
      await Community.findByIdAndUpdate(communityId, {
        $pull: { members: userId },
      });
      return NextResponse.json({ isMember: false });
    } else {
      // Join community
      await Community.findByIdAndUpdate(communityId, {
        $push: { members: userId },
      });
      return NextResponse.json({ isMember: true });
    }
  } catch (error) {
    console.error("POST /api/communities/[communityId]/join error:", error);
    return NextResponse.json(
      { message: "Failed to update membership" },
      { status: 500 }
    );
  }
}