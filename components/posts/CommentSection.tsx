// components/posts/CommentSection.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Heart, Reply, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface CommentSectionProps {
  postId: string;
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", postId],
    queryFn: async () => {
      const res = await fetch(`/api/comments?postId=${postId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch comments");
      }
      return res.json();
    },
    enabled: !!postId,
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post comment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setContent("");
      toast.success("Comment added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add comment");
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ parentId, content }: { parentId: string; content: string }) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, parentId }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to post reply");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      setReplyContent("");
      setReplyTo(null);
      toast.success("Reply added");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add reply");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch("/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action: "like" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to like comment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to like comment");
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch("/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, action: "unlike" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to unlike comment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unlike comment");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return toast.error("Please login");
    if (!content.trim()) return;
    commentMutation.mutate(content);
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return toast.error("Please login");
    if (!replyContent.trim() || !replyTo) return;
    replyMutation.mutate({ parentId: replyTo, content: replyContent });
  };

  const handleLikeToggle = (commentId: string, isLiked: boolean) => {
    if (!session) return toast.error("Please login");
    if (isLiked) {
      unlikeMutation.mutate(commentId);
    } else {
      likeMutation.mutate(commentId);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-3 space-y-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex animate-pulse items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-8 w-full rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const commentList = comments?.comments || [];

  return (
    <div className="mt-3 space-y-3">
      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={commentMutation.isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={commentMutation.isPending || !content.trim()}>
          {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </Button>
      </form>

      {/* Reply Input */}
      {replyTo && (
        <div className="flex gap-2 pl-8">
          <Input
            placeholder="Write a reply..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            disabled={replyMutation.isPending}
            className="flex-1 text-sm"
          />
          <Button type="button" size="sm" onClick={() => setReplyTo(null)} variant="ghost">
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleReplySubmit}
            disabled={replyMutation.isPending || !replyContent.trim()}
          >
            {replyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reply"}
          </Button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {commentList.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
        ) : (
          commentList.map((comment: any) => (
            <div key={comment._id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author?.image} />
                <AvatarFallback>{comment.author?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{comment.author?.name}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm">{comment.content}</p>
                <div className="mt-1 flex items-center gap-3">
                  <button
                    onClick={() => handleLikeToggle(comment._id, comment.isLiked || false)}
                    className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-red-500"
                    disabled={likeMutation.isPending || unlikeMutation.isPending}
                  >
                    <Heart
                      className={`h-3 w-3 ${comment.isLiked ? "fill-red-500 text-red-500" : ""}`}
                    />
                    {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
                  </button>
                  <button
                    onClick={() => setReplyTo(comment._id)}
                    className="flex items-center gap-1 text-xs text-gray-400 transition-colors hover:text-indigo-500"
                  >
                    <Reply className="h-3 w-3" />
                    Reply
                  </button>
                </div>

                {/* Nested replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-4 dark:border-gray-700">
                    {comment.replies.map((reply: any) => (
                      <div key={reply._id} className="flex items-start gap-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={reply.author?.image} />
                          <AvatarFallback>{reply.author?.name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold">{reply.author?.name}</span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
