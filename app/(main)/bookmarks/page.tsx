"use client";

import { useQuery } from "@tanstack/react-query";
import { PostCard } from "@/components/posts/PostCard";

export default function BookmarksPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      return res.json();
    },
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bookmarks</h1>
      {data?.posts?.length === 0 ? (
        <p className="text-gray-500">You have no bookmarks yet.</p>
      ) : (
        data?.posts?.map((post: any) => <PostCard key={post._id} post={post} />)
      )}
    </div>
  );
}