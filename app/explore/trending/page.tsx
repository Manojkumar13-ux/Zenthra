// app/explore/trending/page.tsx
import { connectDB } from "@/lib/db/connect";
import { Hashtag } from "@/lib/db/models/Hashtag";
import { TrendingHashtag } from "@/lib/db/models/TrendingHashtag";
import Link from "next/link";
import { Hash, TrendingUp, Flame, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TrendingHashtagType {
  _id: string;
  tag: string;
  count: number;
  isTrending?: boolean;
  lastUsed?: string;
}

export default async function TrendingPage() {
  await connectDB();

  // Get trending hashtags from both models
  let hashtags: TrendingHashtagType[] = [];

  try {
    // Try to get from TrendingHashtag model first
    const trendingHashtags = await TrendingHashtag.find({ isActive: true })
      .sort({ count: -1 })
      .limit(50)
      .lean();

    if (trendingHashtags && trendingHashtags.length > 0) {
      hashtags = trendingHashtags.map((tag: any) => ({
        _id: tag._id.toString(),
        tag: tag.tag,
        count: tag.count || 0,
        isTrending: true,
        lastUsed: tag.lastUpdated?.toISOString(),
      }));
    } else {
      // Fallback to Hashtag model
      const allHashtags = await Hashtag.find({})
        .sort({ count: -1 })
        .limit(50)
        .lean();

      hashtags = allHashtags.map((tag: any) => ({
        _id: tag._id.toString(),
        tag: tag.tag,
        count: tag.count || 0,
        isTrending: tag.isTrending || false,
        lastUsed: tag.lastUsed?.toISOString(),
      }));
    }
  } catch (error) {
    console.error("Error fetching trending hashtags:", error);
    // Return empty array if error
    hashtags = [];
  }

  // If no hashtags found, show empty state
  if (hashtags.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold">Trending Hashtags</h1>
          <Badge variant="secondary" className="text-xs">
            <Flame className="mr-1 h-3 w-3" />
            Live
          </Badge>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-12 text-center">
          <Hash className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500">No trending hashtags yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start using #hashtags in your posts to see them trending here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold">Trending Hashtags</h1>
        <Badge variant="secondary" className="text-xs">
          <Flame className="mr-1 h-3 w-3" />
          Live
        </Badge>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 divide-y dark:divide-gray-700">
        {hashtags.map((hashtag, index) => {
          // Ensure _id is a string
          const id = typeof hashtag._id === 'string' ? hashtag._id : String(hashtag._id);
          
          return (
            <Link
              key={id}
              href={`/explore?q=${hashtag.tag}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-400 w-8">
                  #{index + 1}
                </span>
                <div>
                  <span className="font-medium">#{hashtag.tag}</span>
                  {hashtag.isTrending && (
                    <span className="ml-2 text-xs text-orange-500">🔥 Trending</span>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {hashtag.count} {hashtag.count === 1 ? 'post' : 'posts'}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 text-center text-sm text-gray-400">
        <Sparkles className="inline h-3 w-3 mr-1" />
        Hashtags are updated in real-time based on usage
      </div>
    </div>
  );
}