// app/api/explore/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db/connect";
import { Post } from "@/lib/db/models/Post";
import { User } from "@/lib/db/models/User";
import mongoose from "mongoose";

// Category keywords mapping for AI detection
const categoryKeywords: Record<string, string[]> = {
  movie: ["movie", "film", "cinema", "hollywood", "bollywood", "tollywood", "actor", "actress", "director", "trailer", "netflix", "prime", "disney", "marvel", "dc", "oscar", "blockbuster", "box office", "release", "teaser", "poster", "cinematography", "screening"],
  sports: ["sports", "cricket", "football", "basketball", "tennis", "ipl", "world cup", "premier league", "nba", "fifa", "soccer", "athlete", "team", "match", "tournament", "olympics", "kohli", "dhoni", "messi", "ronaldo", "virat", "sachin", "rcb", "csk", "mi", "kkr", "rugby", "golf", "formula"],
  technology: ["tech", "coding", "programming", "developer", "software", "react", "nextjs", "nodejs", "docker", "kubernetes", "aws", "azure", "gcp", "linux", "git", "github", "devops", "fullstack", "frontend", "backend", "javascript", "python", "java", "c++", "rust", "go"],
  music: ["music", "song", "album", "artist", "band", "concert", "spotify", "apple music", "playlist", "melody", "guitar", "piano", "rock", "pop", "hip hop", "rap", "classical", "jazz", "blues", "r&b", "country", "edm", "dance", "remix"],
  gaming: ["gaming", "game", "video game", "esports", "playstation", "xbox", "nintendo", "pc gaming", "mobile gaming", "streamer", "twitch", "valorant", "fortnite", "cod", "minecraft", "roblox", "pubg", "free fire", "bgmi", "call of duty", "fifa", "nba", "gta"],
  business: ["business", "entrepreneur", "startup", "finance", "investing", "stock", "market", "economy", "trading", "crypto", "money", "wealth", "founder", "ceo", "company", "brand", "marketing", "sales", "funding", "venture", "angel", "ipo", "revenue"],
  education: ["education", "learning", "student", "school", "college", "university", "study", "exam", "knowledge", "skills", "course", "tutorial", "teacher", "professor", "lecture", "classroom", "online learning", "edtech", "scholar", "research", "science", "math", "history"]
};

function detectCategory(content: string, hashtags: string[]): string {
  const text = (content || "").toLowerCase();
  const tags = hashtags?.map(t => t.toLowerCase().replace('#', '')) || [];
  const combinedText = text + " " + tags.join(" ");
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }
  return "general";
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type") || "posts";
    const category = searchParams.get("category") || "all";
    const currentUserId = session.user.id;

    // ============ GET POSTS BY CATEGORY ============
    if (type === "posts") {
      let postsQuery: any = { isDeleted: { $ne: true } };
      
      // If category is not "all", filter by category using keywords
      if (category && category !== "all") {
        const keywords = categoryKeywords[category] || [];
        if (keywords.length > 0) {
          postsQuery.$or = [
            { content: { $regex: keywords.join("|"), $options: "i" } },
            { hashtags: { $in: keywords.map(k => `#${k}`) } }
          ];
        }
      }
      
      // If there's a search query
      if (query) {
        postsQuery.$or = postsQuery.$or || [];
        postsQuery.$or.push(
          { content: { $regex: query, $options: "i" } },
          { hashtags: { $regex: query, $options: "i" } }
        );
      }

      const posts = await Post.find(postsQuery)
        .sort({ createdAt: -1 })
        .limit(20)
        .populate("author", "name username image verified")
        .lean();

      const postsWithData = posts.map((post: any) => {
        const liked = post.likes?.some((id: any) => id.toString() === currentUserId) || false;
        const bookmarked = post.bookmarks?.some((id: any) => id.toString() === currentUserId) || false;
        const reposted = post.reposts?.some((id: any) => id.toString() === currentUserId) || false;
        const detectedCategory = detectCategory(post.content, post.hashtags);
        
        return { 
          ...post, 
          liked,
          bookmarked,
          reposted,
          category: detectedCategory,
          author: post.author || { name: "Unknown", username: "unknown" }
        };
      });
      
      return NextResponse.json({ results: postsWithData });
    }

    // ============ GET USERS ============
    if (type === "users") {
      const users = await User.find({
        _id: { $ne: new mongoose.Types.ObjectId(currentUserId) },
      })
        .select("name username image bio followers following")
        .limit(10)
        .lean();

      const currentUser = await User.findById(currentUserId).select("following");
      const followingIds = currentUser?.following?.map((id: any) => id.toString()) || [];

      const usersWithFollow = users.map((user) => ({
        ...user,
        isFollowing: followingIds.includes(user._id.toString()),
        followersCount: user.followers?.length || 0,
        postsCount: 0,
      }));

      return NextResponse.json({ results: usersWithFollow });
    }

    // ============ GET HASHTAGS ============
    if (type === "hashtags") {
      const posts = await Post.find({ isDeleted: { $ne: true } }).lean();
      const hashtagMap = new Map();
      
      posts.forEach((post: any) => {
        if (post.hashtags && post.hashtags.length > 0) {
          post.hashtags.forEach((tag: string) => {
            const cleanTag = tag.toLowerCase().replace(/^#/, '');
            if (hashtagMap.has(cleanTag)) {
              hashtagMap.set(cleanTag, hashtagMap.get(cleanTag) + 1);
            } else {
              hashtagMap.set(cleanTag, 1);
            }
          });
        }
      });

      const trendingHashtags = Array.from(hashtagMap.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      return NextResponse.json({ results: trendingHashtags });
    }

    return NextResponse.json({ results: [] });
  } catch (error) {
    console.error("GET /api/explore error:", error);
    return NextResponse.json(
      { message: "Failed to search", results: [] },
      { status: 500 }
    );
  }
}