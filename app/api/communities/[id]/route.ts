// app/api/communities/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Community } from "@/lib/db/models/Community";
import { Post } from "@/lib/db/models/Post";
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
      .populate("posts")
      .lean();

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    // Type assertion to handle populated fields
    const communityData = community as any;

    // Check if user is a member
    const members = communityData.members || [];
    const admins = communityData.admins || [];

    const memberIds = members.map((m: any) => m._id.toString()) || [];
    const adminIds = admins.map((m: any) => m._id.toString()) || [];

    const isMember = memberIds.includes(session.user.id);
    const isAdmin = adminIds.includes(session.user.id);

    // If community is private and user is not a member, restrict access
    if (communityData.isPrivate && !isMember) {
      return NextResponse.json(
        { error: "This community is private" },
        { status: 403 }
      );
    }

    // Format response
    const formattedCommunity = {
      _id: communityData._id.toString(),
      name: communityData.name,
      description: communityData.description,
      image: communityData.image,
      coverImage: communityData.coverImage,
      isPrivate: communityData.isPrivate,
      members: members.map((m: any) => ({
        _id: m._id.toString(),
        name: m.name,
        username: m.username,
        image: m.image,
        bio: m.bio,
      })),
      admins: admins.map((m: any) => ({
        _id: m._id.toString(),
        name: m.name,
        username: m.username,
        image: m.image,
        bio: m.bio,
      })),
      posts: communityData.posts || [],
      memberCount: members.length,
      adminCount: admins.length,
      isMember,
      isAdmin,
      createdAt: communityData.createdAt?.toISOString(),
      updatedAt: communityData.updatedAt?.toISOString(),
    };

    return NextResponse.json({
      community: formattedCommunity,
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json(
      { error: "Failed to fetch community" },
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
    const { name, description, image, coverImage, isPrivate } = body;

    await connectDB();

    const community = await Community.findById(params.id);

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const communityData = community as any;

    // Check if user is an admin
    if (!communityData.admins?.includes(session.user.id)) {
      return NextResponse.json(
        { error: "Only admins can update community details" },
        { status: 403 }
      );
    }

    // Update fields
    if (name) communityData.name = name;
    if (description) communityData.description = description;
    if (image) communityData.image = image;
    if (coverImage) communityData.coverImage = coverImage;
    if (isPrivate !== undefined) communityData.isPrivate = isPrivate;

    await communityData.save();

    return NextResponse.json({
      success: true,
      message: "Community updated successfully",
      community: {
        _id: communityData._id.toString(),
        name: communityData.name,
        description: communityData.description,
        image: communityData.image,
        coverImage: communityData.coverImage,
        isPrivate: communityData.isPrivate,
        memberCount: communityData.members?.length || 0,
        adminCount: communityData.admins?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error updating community:", error);
    return NextResponse.json(
      { error: "Failed to update community" },
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

    await connectDB();

    const community = await Community.findById(params.id);

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const communityData = community as any;

    // Check if user is an admin
    if (!communityData.admins?.includes(session.user.id)) {
      return NextResponse.json(
        { error: "Only admins can delete this community" },
        { status: 403 }
      );
    }

    // Delete all posts in the community
    if (communityData.posts && communityData.posts.length > 0) {
      await Post.deleteMany({ _id: { $in: communityData.posts } });
    }

    // Delete the community
    await Community.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: "Community deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting community:", error);
    return NextResponse.json(
      { error: "Failed to delete community" },
      { status: 500 }
    );
  }
}