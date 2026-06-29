// app/api/feed/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// ✅ Mock posts data
const mockPosts = [
  {
    _id: "1",
    content: "🚀 Just launched my new project! Check it out!",
    author: {
      _id: "user1",
      name: "John Doe",
      username: "johndoe",
      image: null,
      bio: "Developer | Creator",
    },
    likesCount: 42,
    commentsCount: 12,
    repostsCount: 5,
    liked: false,
    bookmarked: false,
    reposted: false,
    media: [],
    hashtags: ["project", "coding"],
    mood: "excited",
    category: "technology",
    viewsCount: 150,
    isPinned: false,
    aiSummary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: "2",
    content: "🎵 Just discovered an amazing new artist. Their music is 🔥",
    author: {
      _id: "user2",
      name: "Jane Smith",
      username: "janesmith",
      image: null,
      bio: "Music Lover 🎵",
    },
    likesCount: 28,
    commentsCount: 8,
    repostsCount: 3,
    liked: false,
    bookmarked: false,
    reposted: false,
    media: [],
    hashtags: ["music", "newartist"],
    mood: "happy",
    category: "music",
    viewsCount: 89,
    isPinned: false,
    aiSummary: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: "3",
    content: "🏀 What a game! Can't believe we won!",
    author: {
      _id: "user3",
      name: "Mike Johnson",
      username: "mikejohnson",
      image: null,
      bio: "Sports Fan ⚽",
    },
    likesCount: 56,
    commentsCount: 23,
    repostsCount: 7,
    liked: false,
    bookmarked: false,
    reposted: false,
    media: [],
    hashtags: ["sports", "basketball"],
    mood: "excited",
    category: "sports",
    viewsCount: 210,
    isPinned: false,
    aiSummary: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    _id: "4",
    content: "📚 Just finished reading an incredible book. Highly recommend!",
    author: {
      _id: "user4",
      name: "Sarah Wilson",
      username: "sarahwilson",
      image: null,
      bio: "Bookworm 📖",
    },
    likesCount: 34,
    commentsCount: 15,
    repostsCount: 4,
    liked: false,
    bookmarked: false,
    reposted: false,
    media: [],
    hashtags: ["books", "reading"],
    mood: "thoughtful",
    category: "education",
    viewsCount: 112,
    isPinned: false,
    aiSummary: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    _id: "5",
    content: "💡 New idea for a startup! Who wants to join?",
    author: {
      _id: "user5",
      name: "Alex Brown",
      username: "alexbrown",
      image: null,
      bio: "Entrepreneur 🚀",
    },
    likesCount: 67,
    commentsCount: 31,
    repostsCount: 12,
    liked: false,
    bookmarked: false,
    reposted: false,
    media: [],
    hashtags: ["startup", "business"],
    mood: "excited",
    category: "business",
    viewsCount: 280,
    isPinned: false,
    aiSummary: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    _id: "6",
    content: "🎮 Finally beat the final boss after 100 attempts! 💪",
    author: {
      _id: "user6",
      name: "Chris Lee",
      username: "chrislee",
      image: null,
      bio: "Gamer 🎮",
    },
    likesCount: 89,
    commentsCount: 45,
    repostsCount: 18,
    liked: false,
    bookmarked: false,
    reposted: false,
    media: [],
    hashtags: ["gaming", "achievement"],
    mood: "excited",
    category: "gaming",
    viewsCount: 350,
    isPinned: false,
    aiSummary: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    _id: "7",
    content: "🍿 Just watched the new movie. It was amazing! 🎬",
    author: {
      _id: "user7",
      name: "Emma Davis",
      username: "emmadavis",
      image: null,
      bio: "Movie Buff 🎬",
    },
    likesCount: 45,
    commentsCount: 22,
    repostsCount: 8,
    liked: false,
    bookmarked: false,
    reposted: false,
    media: [],
    hashtags: ["movies", "review"],
    mood: "happy",
    category: "movie",
    viewsCount: 180,
    isPinned: false,
    aiSummary: null,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "for-you";
    const category = searchParams.get("category") || "all";
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    console.log("📊 Feed request:", { tab, category, limit, page });

    // Filter posts by category
    let filteredPosts = [...mockPosts];
    
    if (category !== "all") {
      filteredPosts = filteredPosts.filter(
        (post) => post.category === category
      );
    }

    // Apply tab filtering
    if (tab === "trending") {
      filteredPosts = filteredPosts.sort((a, b) => b.likesCount - a.likesCount);
    } else if (tab === "for-you") {
      // Mix of popular and recent
      filteredPosts = filteredPosts.sort((a, b) => {
        const scoreA = a.likesCount + a.commentsCount * 2 + a.repostsCount * 3;
        const scoreB = b.likesCount + b.commentsCount * 2 + b.repostsCount * 3;
        return scoreB - scoreA;
      });
    } else if (tab === "following") {
      // For mock data, just show random posts
      filteredPosts = filteredPosts.sort(() => Math.random() - 0.5);
    }

    // Pagination
    const total = filteredPosts.length;
    const paginatedPosts = filteredPosts.slice(skip, skip + limit);

    // If no posts, return empty array
    if (paginatedPosts.length === 0) {
      return NextResponse.json({
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0,
          hasNext: false,
          hasPrev: page > 1,
        },
      });
    }

    return NextResponse.json({
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("❌ Feed API Error:", error);
    
    // Return mock data as fallback
    return NextResponse.json({
      posts: mockPosts.slice(0, 10),
      pagination: {
        page: 1,
        limit: 10,
        total: mockPosts.length,
        pages: 1,
        hasNext: false,
        hasPrev: false,
      },
    });
  }
}