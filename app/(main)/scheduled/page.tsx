"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function ScheduledPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["scheduled"],
    queryFn: async () => {
      const res = await fetch("/api/scheduled");
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/scheduled/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to cancel");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled"] });
      toast.success("Scheduled post cancelled.");
    },
    onError: () => toast.error("Error cancelling schedule."),
  });

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Scheduled Posts</h1>
      {data?.length === 0 ? (
        <p className="text-gray-500">No scheduled posts.</p>
      ) : (
        data?.map((post: any) => (
          <Card key={post._id} className="p-4 flex justify-between items-center">
            <div>
              <p className="line-clamp-1">{post.content}</p>
              <p className="text-sm text-gray-500">
                Scheduled for {format(new Date(post.scheduledAt), "PPP p")}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cancelMutation.mutate(post._id)}
              disabled={cancelMutation.isPending}
            >
              Cancel
            </Button>
          </Card>
        ))
      )}
    </div>
  );
}