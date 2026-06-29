// app/(main)/scheduled/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Loader2, Trash2, Edit, CalendarClock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

interface ScheduledPost {
  _id: string;
  content: string;
  media: string[];
  hashtags: string[];
  scheduledAt: string;
  category: string;
  mood?: string;
  createdAt: string;
  isScheduled: boolean;
}

export default function ScheduledPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [formData, setFormData] = useState({
    content: "",
    scheduledAt: "",
    category: "general",
    hashtags: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.user) {
      fetchScheduledPosts();
    }
  }, [session, status, router]);

  const fetchScheduledPosts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/scheduled");
      if (!res.ok) throw new Error("Failed to fetch scheduled posts");
      const data = await res.json();
      setScheduledPosts(data.posts || []);
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      toast.error("Failed to load scheduled posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled post?")) return;
    try {
      const res = await fetch(`/api/scheduled?id=${postId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete scheduled post");
      setScheduledPosts((prev) => prev.filter((post) => post._id !== postId));
      toast.success("Scheduled post deleted");
    } catch (error) {
      console.error("Error deleting scheduled post:", error);
      toast.error("Failed to delete scheduled post");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim() || !formData.scheduledAt) {
      toast.error("Content and scheduled time are required");
      return;
    }

    try {
      const payload = {
        content: formData.content.trim(),
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        category: formData.category,
        hashtags: formData.hashtags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const url = editingPost ? `/api/scheduled/${editingPost._id}` : "/api/scheduled";
      const method = editingPost ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save scheduled post");
      }

      const data = await res.json();
      toast.success(editingPost ? "Scheduled post updated" : "Post scheduled successfully");
      setIsDialogOpen(false);
      setEditingPost(null);
      setFormData({ content: "", scheduledAt: "", category: "general", hashtags: "" });
      fetchScheduledPosts();
    } catch (error) {
      console.error("Error saving scheduled post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save");
    }
  };

  const openEditDialog = (post: ScheduledPost) => {
    setEditingPost(post);
    setFormData({
      content: post.content,
      scheduledAt: new Date(post.scheduledAt).toISOString().slice(0, 16),
      category: post.category || "general",
      hashtags: post.hashtags?.join(", ") || "",
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex items-center justify-between p-4">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Posts</h1>
          <p className="text-sm text-muted-foreground">Manage your scheduled content</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Post
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPost ? "Edit Scheduled Post" : "Schedule New Post"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Content</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="What's on your mind?"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Schedule Date & Time</label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., technology, music"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Hashtags (comma separated)</label>
                <Input
                  value={formData.hashtags}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hashtags: e.target.value }))}
                  placeholder="e.g., tech, ai, coding"
                />
              </div>
              <Button type="submit" className="w-full">
                {editingPost ? "Update" : "Schedule"} Post
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {scheduledPosts.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-2 text-muted-foreground">No scheduled posts</p>
          <p className="text-sm text-muted-foreground">Schedule your first post to publish later</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scheduledPosts.map((post) => (
            <Card key={post._id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm">{post.content}</p>
                    <div className="flex flex-wrap gap-2">
                      {post.hashtags?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                      {post.category && (
                        <Badge variant="outline" className="text-xs">
                          {post.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Scheduled for: {new Date(post.scheduledAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(post)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(post._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
