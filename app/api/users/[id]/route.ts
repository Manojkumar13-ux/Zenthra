// app/api/users/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
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

    const user = await User.findById(params.id)
      .select("-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken")
      .lean();

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Type assertion to handle the user data
    const userData = user as any;

    // Check if current user is following this user
    const currentUser = await User.findById(session.user.id)
      .select("following")
      .lean();

    const currentUserData = currentUser as any;
    const followingIds = currentUserData?.following?.map((id: any) => id.toString()) || [];
    const isFollowing = followingIds.includes(params.id);

    const formattedUser = {
      _id: userData._id.toString(),
      name: userData.name,
      username: userData.username,
      email: userData.email,
      image: userData.image || null,
      coverImage: userData.coverImage || null,
      bio: userData.bio || "",
      location: userData.location || "",
      website: userData.website || "",
      followers: userData.followers?.map((id: any) => id.toString()) || [],
      following: userData.following?.map((id: any) => id.toString()) || [],
      followersCount: userData.followers?.length || 0,
      followingCount: userData.following?.length || 0,
      postsCount: userData.postsCount || 0,
      isFollowing,
      isOwnProfile: session.user.id === params.id,
      createdAt: userData.createdAt?.toISOString(),
      updatedAt: userData.updatedAt?.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
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

    // Check if user is updating their own profile
    if (session.user.id !== params.id) {
      return NextResponse.json(
        { error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, bio, location, website, image, coverImage } = body;

    await connectDB();

    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update fields
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (location !== undefined) user.location = location;
    if (website !== undefined) user.website = website;
    if (image) user.image = image;
    if (coverImage) user.coverImage = coverImage;

    await user.save();

    const updatedUser = await User.findById(params.id)
      .select("-password -resetPasswordToken -resetPasswordExpires -emailVerificationToken")
      .lean();

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    const updatedUserData = updatedUser as any;

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUserData._id.toString(),
        name: updatedUserData.name,
        username: updatedUserData.username,
        email: updatedUserData.email,
        image: updatedUserData.image || null,
        coverImage: updatedUserData.coverImage || null,
        bio: updatedUserData.bio || "",
        location: updatedUserData.location || "",
        website: updatedUserData.website || "",
        followersCount: updatedUserData.followers?.length || 0,
        followingCount: updatedUserData.following?.length || 0,
        postsCount: updatedUserData.postsCount || 0,
        createdAt: updatedUserData.createdAt?.toISOString(),
        updatedAt: updatedUserData.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
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

    // Check if user is deleting their own account or is admin
    const isOwnAccount = session.user.id === params.id;
    const isAdmin = session.user.role === "admin";

    if (!isOwnAccount && !isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own account" },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(params.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Delete user
    await User.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}