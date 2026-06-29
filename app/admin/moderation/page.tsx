"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["moderation-posts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/moderation");
      return res.json();
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ postId, action }: { postId: string; action: "approve" | "remove" }) => {
      await fetch(`/api/admin/moderation/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-posts"] });
      toast.success("Post moderated.");
    },
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Content Moderation</h1>
      {data?.length === 0 ? (
        <p>No flagged posts.</p>
      ) : (
        data?.map((post: any) => (
          <Card key={post._id} className="mb-2 p-4">
            <p>{post.content}</p>
            <p className="text-sm text-gray-500">By: {post.author.name}</p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={() => moderateMutation.mutate({ postId: post._id, action: "approve" })}
              >
                Approve
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => moderateMutation.mutate({ postId: post._id, action: "remove" })}
              >
                Remove
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
