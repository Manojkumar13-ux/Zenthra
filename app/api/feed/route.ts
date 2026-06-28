// app/api/feed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "for-you";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    let postsQuery: any = { isDeleted: { $ne: true } };
    let sortQuery: any = { createdAt: -1 };

    // ============ FOR YOU TAB ============
    if (tab === "for-you") {
      // Show all non-deleted posts
    }

    // ============ FOLLOWING TAB ============
    if (tab === "following") {
      const user = await User.findById(userId).select("following");
      const followingIds = user?.following?.map((id: any) => id.toString()) || [];
      
      if (followingIds.length === 0) {
        return NextResponse.json({
          posts: [],
          pagination: {
            total: 0,
            page,
            limit,
            hasNext: false,
          },
        });
      }
      
      postsQuery.author = { $in: followingIds };
    }

    // ============ TRENDING TAB ============
    if (tab === "trending") {
      postsQuery.$or = [
        { hashtags: { $exists: true, $ne: [] } },
        { likes: { $exists: true, $ne: [] } },
        { comments: { $exists: true, $ne: [] } }
      ];
      sortQuery = { likesCount: -1, commentsCount: -1, createdAt: -1 };
    }

    // ============ COMMUNITIES TAB ============
    if (tab === "communities") {
      const user = await User.findById(userId).select("communities");
      const communityIds = user?.communities || [];
      
      if (communityIds.length === 0) {
        return NextResponse.json({
          posts: [],
          pagination: {
            total: 0,
            page,
            limit,
            hasNext: false,
          },
        });
      }
      
      postsQuery.community = { $in: communityIds };
    }

    const skip = (page - 1) * limit;
    
    const [posts, totalCount] = await Promise.all([
      Post.find(postsQuery)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .populate("author", "name username image verified")
        .lean(),
      Post.countDocuments(postsQuery),
    ]);

    const postsWithData = posts.map((post: any) => {
      const liked = post.likes?.some((id: any) => id.toString() === userId) || false;
      const bookmarked = post.bookmarks?.some((id: any) => id.toString() === userId) || false;
      const reposted = post.reposts?.some((id: any) => id.toString() === userId) || false;
      
      return { 
        ...post, 
        liked,
        bookmarked,
        reposted,
        likesCount: post.likes?.length || 0,
        commentsCount: post.comments?.length || 0,
        repostsCount: post.reposts?.length || 0,
        author: post.author || { 
          name: "Unknown", 
          username: "unknown", 
          _id: post.author || userId 
        }
      };
    });

    const hasNext = skip + posts.length < totalCount;

    return NextResponse.json({
      posts: postsWithData,
      pagination: {
        total: totalCount,
        page,
        limit,
        hasNext,
      },
    });

  } catch (error) {
    console.error("❌ Feed API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}