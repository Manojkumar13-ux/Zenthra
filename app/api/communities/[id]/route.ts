import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db/connect";
import { Community } from "@/lib/db/models/Community";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const community = await Community.findById(params.id)
      .populate("owner", "name username image")
      .populate("members", "name username image")
      .populate("moderators", "name username image")
      .populate({
        path: "posts",
        populate: {
          path: "author",
          select: "name username image",
        },
        options: { sort: { createdAt: -1 } },
      })
      .lean();

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check if user is a member
    const memberIds = community.members?.map((m: any) => m._id.toString()) || [];
    const moderatorIds = community.moderators?.map((m: any) => m._id.toString()) || [];

    const isMember = memberIds.includes(session.user.id);
    const isModerator = moderatorIds.includes(session.user.id);
    const isOwner = community.owner?._id.toString() === session.user.id || false;

    // If private and not a member, don't show posts
    const shouldShowPosts = isMember || !community.isPrivate || isOwner;

    const communityData = {
      ...community,
      _id: community._id.toString(),
      isMember,
      isModerator,
      isOwner,
      memberCount: community.members?.length || 0,
      posts: shouldShowPosts ? community.posts : [],
    };

    return NextResponse.json(communityData);
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json({ error: "Failed to fetch community" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isPrivate, image } = body;

    await connectDB();

    const community = await Community.findById(params.id);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Only owner can update
    if (community.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can update this community" },
        { status: 403 }
      );
    }

    if (name) community.name = name.trim();
    if (description !== undefined) community.description = description;
    if (isPrivate !== undefined) community.isPrivate = isPrivate;
    if (image) community.image = image;

    await community.save();

    const populated = await Community.findById(community._id)
      .populate("owner", "name username image")
      .populate("members", "name username image")
      .populate("moderators", "name username image")
      .lean();

    return NextResponse.json(populated);
  } catch (error) {
    console.error("Error updating community:", error);
    return NextResponse.json({ error: "Failed to update community" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const community = await Community.findById(params.id);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Only owner can delete
    if (community.owner.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can delete this community" },
        { status: 403 }
      );
    }

    await Community.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting community:", error);
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }
}
