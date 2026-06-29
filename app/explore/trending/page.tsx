// app/explore/trending/page.tsx
import { connectDB } from "@/lib/db/connect";
import { Hashtag } from "@/lib/db/models/Hashtag";
import Link from "next/link";
import { Hash, TrendingUp } from "lucide-react";

export default async function TrendingPage() {
  await connectDB();

  const hashtags = await Hashtag.find({}).sort({ count: -1 }).limit(50).lean();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <TrendingUp className="h-8 w-8 text-blue-500" />
        <h1 className="text-2xl font-bold">Trending Hashtags</h1>
      </div>

      {hashtags.length === 0 ? (
        <div className="rounded-xl border bg-white py-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <Hash className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500">No hashtags yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Start using #hashtags in your posts to see them here!
          </p>
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-white dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-800">
          {hashtags.map((hashtag, index) => (
            <Link
              key={hashtag._id}
              href={`/explore?q=${hashtag.tag}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 text-sm font-medium text-gray-400">#{index + 1}</span>
                <div>
                  <span className="font-medium">#{hashtag.tag}</span>
                  {hashtag.isTrending && (
                    <span className="ml-2 text-xs text-orange-500">🔥 Trending</span>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-500">
                {hashtag.count} {hashtag.count === 1 ? "post" : "posts"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
