// app/explore/trending/page.tsx
import { connectDB } from "@/lib/db/connect";
import { Hashtag } from "@/lib/db/models/Hashtag";
import Link from "next/link";
import { Hash, TrendingUp } from "lucide-react";

export default async function TrendingPage() {
  await connectDB();

  const hashtags = await Hashtag.find({})
    .sort({ count: -1 })
    .limit(50)
    .lean();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold">Trending Hashtags</h1>
      </div>

      {hashtags.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <Hash className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500">No hashtags yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Start using #hashtags in your posts to see them here!
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 divide-y dark:divide-gray-700">
          {hashtags.map((hashtag, index) => (
            <Link
              key={hashtag._id}
              href={`/explore?q=${hashtag.tag}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
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
          ))}
        </div>
      )}
    </div>
  );
}