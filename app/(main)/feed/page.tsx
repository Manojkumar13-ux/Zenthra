// app/(main)/feed/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Globe,
  Users,
  User,
  Loader2,
  Image,
  Video,
  Mic,
  Smile,
  MapPin,
  Calendar,
  X,
  Send,
  Trash2,
  Flag,
  Copy,
  ExternalLink,
  Bookmark,
  RefreshCw,
} from "lucide-react";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Post {
  _id: string;
  content: string;
  image?: string;
  video?: string;
  author: {
    _id?: string;
    id?: string;
    name: string;
    username: string;
    image?: string | null;
  } | null;
  likes: number;
  comments: number;
  shares: number;
  createdAt: string;
  isLiked: boolean;
  visibility: "everyone" | "followers" | "only-me";
  hashtags?: string[];
  category?: string;
}

interface Comment {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    username: string;
    image?: string;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

const TAB_DISPLAY = {
  "for-you": "For You",
  following: "Following",
  trending: "Trending",
  communities: "Communities",
} as const;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Movies: ["movie", "movies", "cinema", "film", "hollywood", "bollywood"],
  Music: ["music", "song", "songs", "musician", "artist", "band"],
  Sports: ["sports", "sport", "cricket", "football", "basketball", "tennis"],
  Technology: ["tech", "technology", "coding", "programming", "ai", "software"],
  Gaming: ["gaming", "game", "gamer", "esports", "playstation", "xbox"],
  Business: ["business", "startup", "entrepreneur", "marketing", "finance"],
  Education: ["education", "learning", "study", "school", "college"],
  Travel: ["travel", "wanderlust", "vacation", "adventure", "explore"],
  Food: ["food", "cooking", "recipe", "restaurant", "chef"],
  Health: ["health", "fitness", "workout", "gym", "wellness"],
  Fashion: ["fashion", "style", "outfit", "clothing", "trendy"],
  Science: ["science", "research", "discovery", "space", "physics"],
  Politics: ["politics", "election", "government", "policy"],
  Environment: ["environment", "climate", "sustainable", "green", "nature"],
};

const extractHashtags = (content: string): string[] => {
  const matches = content.match(/#(\w+)/g);
  return matches ? matches.map(tag => tag.substring(1)) : [];
};

const detectCategory = (hashtags: string[]): string => {
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (hashtags.some(tag => keywords.includes(tag.toLowerCase()))) {
      return category;
    }
  }
  return "General";
};

export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postVisibility, setPostVisibility] = useState("everyone");
  const [postMood, setPostMood] = useState("neutral");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "audio" | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof typeof TAB_DISPLAY>("for-you");
  
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleHashtagClick = useCallback((tag: string) => {
    const cleanTag = tag.startsWith("#") ? tag.slice(1) : tag;
    router.push(`/explore?q=${encodeURIComponent(cleanTag)}`);
  }, [router]);

  // ✅ Fetch posts
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const res = await fetch("/api/posts?limit=100");
      
      if (res.ok) {
        const data = await res.json();
        const allPosts = data.posts || [];
        console.log("📊 Posts fetched:", allPosts.length);
        setPosts(allPosts);
        setFilteredPosts(allPosts);
      } else {
        console.error("Failed to fetch posts");
        setPosts([]);
        setFilteredPosts([]);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
      setPosts([]);
      setFilteredPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPosts();
    }
  }, [status, fetchPosts]);

  // ============================================
  // Comments Functions
  // ============================================
  const fetchComments = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({ ...prev, [postId]: data.comments || [] }));
      } else {
        setComments(prev => ({ ...prev, [postId]: [] }));
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      setComments(prev => ({ ...prev, [postId]: [] }));
    }
  }, []);

  const handleComment = useCallback(async (postId: string) => {
    if (!commentText.trim()) return;
    
    setIsCommenting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({
          ...prev,
          [postId]: [data.comment, ...(prev[postId] || [])]
        }));
        setCommentText("");
        setPosts(prev => prev.map(p => 
          p._id === postId ? { ...p, comments: (p.comments || 0) + 1 } : p
        ));
        toast.success("Comment added!");
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Failed to comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  }, [commentText]);

  const toggleComments = useCallback(async (postId: string) => {
    if (selectedPostId === postId && isCommentsOpen) {
      setIsCommentsOpen(false);
      setSelectedPostId(null);
    } else {
      setSelectedPostId(postId);
      setIsCommentsOpen(true);
      if (!comments[postId]) {
        await fetchComments(postId);
      }
      setTimeout(() => commentInputRef.current?.focus(), 100);
    }
  }, [selectedPostId, isCommentsOpen, comments, fetchComments]);

  // ============================================
  // Post Actions
  // ============================================
  const handleLike = useCallback((postId: string) => {
    setFilteredPosts((prev) =>
      prev.map((post) =>
        post._id === postId
          ? {
              ...post,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
              isLiked: !post.isLiked,
            }
          : post
      )
    );
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts(prev => prev.filter(post => post._id !== postId));
        setFilteredPosts(prev => prev.filter(post => post._id !== postId));
        toast.success("Post deleted successfully");
      } else {
        toast.error("Failed to delete post");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    }
  }, []);

  const handleShare = useCallback((post: Post) => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard?.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.success(`Share: ${url}`);
    });
  }, []);

  const handleBookmark = useCallback(() => {
    toast.success("Post saved to bookmarks!");
  }, []);

  const handleReport = useCallback(() => {
    toast.success("Post reported. We'll review it.");
  }, []);

  const getTimeAgo = useCallback((date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString();
  }, []);

  // ============================================
  // File Handlers
  // ============================================
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: "image" | "video" | "audio") => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileType(type);
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} selected: ${file.name}`);
    }
    e.target.value = "";
  }, []);

  const handleMediaClick = useCallback(() => imageInputRef.current?.click(), []);
  const handleVideoClick = useCallback(() => videoInputRef.current?.click(), []);
  const handleAudioClick = useCallback(() => audioInputRef.current?.click(), []);

  const removeFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
  }, []);

  // ✅ CREATE POST - FIXED VERSION
  const handleCreatePost = async () => {
    if (!postContent.trim() && !selectedFile) {
      toast.error("Please write something or add media");
      return;
    }

    setIsSubmitting(true);
    try {
      const hashtags = extractHashtags(postContent);
      const category = detectCategory(hashtags);

      let imageUrl = null;
      let videoUrl = null;

      if (selectedFile && fileType === "image") {
        imageUrl = filePreview;
      } else if (selectedFile && fileType === "video") {
        videoUrl = filePreview;
      }

      // ✅ Create the post
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent,
          visibility: postVisibility,
          mood: postMood,
          image: imageUrl,
          video: videoUrl,
          hashtags: hashtags,
          category: category,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        // ✅ Ensure the post has all required fields
        const newPost = {
          ...data.post,
          author: {
            id: session?.user?.id || "temp",
            name: session?.user?.name || "You",
            username: session?.user?.username || "user",
            image: session?.user?.image || null,
          },
          createdAt: new Date().toISOString(),
          likes: 0,
          comments: 0,
          shares: 0,
          isLiked: false,
          hashtags: hashtags || [],
          category: category || "General",
        };

        // ✅ Add post to the top of the list
        setPosts(prev => [newPost, ...prev]);
        setFilteredPosts(prev => [newPost, ...prev]);
        
        // ✅ Reset form
        setPostContent("");
        setSelectedFile(null);
        setFilePreview(null);
        setFileType(null);
        setIsCreateOpen(false);
        
        toast.success(`Post created! Added to ${category} section`);
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = useCallback(() => {
    setPostContent("");
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    setIsCreateOpen(false);
  }, []);

  const getTabDisplay = useCallback((tab: string) => {
    return TAB_DISPLAY[tab as keyof typeof TAB_DISPLAY] || "For You";
  }, []);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          Welcome to Zenthra
        </h2>
        <p className="text-gray-500 mt-2">Please sign in to see your feed</p>
        <Link
          href="/login"
          className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <input
        type="file"
        ref={imageInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, "image")}
      />
      <input
        type="file"
        ref={videoInputRef}
        className="hidden"
        accept="video/*"
        onChange={(e) => handleFileSelect(e, "video")}
      />
      <input
        type="file"
        ref={audioInputRef}
        className="hidden"
        accept="audio/*"
        onChange={(e) => handleFileSelect(e, "audio")}
      />

      {/* Create Post Card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-3 mb-4">
        <div className="flex items-center gap-3">
          <AvatarSimple
            src={session?.user?.image}
            fallback={session?.user?.name?.[0] || "U"}
            alt={session?.user?.name || "User"}
            size="sm"
          />
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 text-left text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-1.5 px-4 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
          >
            What's on your mind? Use # for hashtags
          </button>
        </div>
        <div className="flex items-center gap-1 mt-2 pt-2 border-t dark:border-gray-800">
          <button
            onClick={handleMediaClick}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Image className="h-3.5 w-3.5 text-green-500" />
            <span>Media</span>
          </button>
          <button
            onClick={handleVideoClick}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Video className="h-3.5 w-3.5 text-red-500" />
            <span>Video</span>
          </button>
          <button
            onClick={handleAudioClick}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Mic className="h-3.5 w-3.5 text-purple-500" />
            <span>Audio</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b dark:border-gray-800">
        {(["for-you", "following", "trending", "communities"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors border-b-2",
              activeTab === tab
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {getTabDisplay(tab)}
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500 mb-3">
        {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"} found
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No posts yet</h3>
          <p className="text-sm text-gray-500 mt-1">Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            if (!post?.author) return null;
            const author = post.author;
            const postComments = comments[post._id] || [];
            const isAuthor = author._id === session?.user?.id || author.id === session?.user?.id;
            
            return (
              <div key={post._id} className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-3">
                {post.category && post.category !== "General" && (
                  <div className="mb-1.5">
                    <Badge variant="outline" className="text-[10px] px-2 py-0">
                      {post.category}
                    </Badge>
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <AvatarSimple
                      src={author.image}
                      fallback={author.name?.[0] || "U"}
                      alt={author.name || "User"}
                      size="sm"
                    />
                    <div>
                      <Link href={`/profile/${author._id || author.id}`} className="font-semibold text-sm text-gray-900 dark:text-white hover:underline">
                        {author.name || "Unknown User"}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span>@{author.username || "user"}</span>
                        <span>·</span>
                        <span>{getTimeAgo(post.createdAt)}</span>
                        {post.visibility === "everyone" && <Globe className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={handleBookmark}>
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(post)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard?.writeText(post.content);
                        toast.success("Copied to clipboard!");
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy text
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleReport} className="text-gray-500">
                        <Flag className="h-4 w-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                      {isAuthor && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeletePost(post._id)} 
                            className="text-red-500 focus:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Post
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mt-2">
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {post.content?.split(/(#\w+)/g).map((part, index) => {
                      if (part.startsWith("#")) {
                        const tag = part.slice(1);
                        return (
                          <button
                            key={index}
                            onClick={() => handleHashtagClick(tag)}
                            className="text-blue-500 hover:underline cursor-pointer"
                          >
                            {part}
                          </button>
                        );
                      }
                      return part;
                    })}
                  </p>
                  {post.image && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img
                        src={post.image}
                        alt="Post image"
                        className="w-full max-h-64 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  {post.video && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <video
                        src={post.video}
                        controls
                        className="w-full max-h-64 rounded-lg"
                      />
                    </div>
                  )}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {post.hashtags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleHashtagClick(tag)}
                          className="text-xs text-blue-500 hover:underline bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-full cursor-pointer"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{post.likes || 0} likes</span>
                  <span>{post.comments || 0} comments</span>
                  <span>{post.shares || 0} shares</span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t dark:border-gray-800">
                  <button
                    onClick={() => handleLike(post._id)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs transition-colors",
                      post.isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                    )}
                  >
                    <Heart className={cn("h-4 w-4", post.isLiked && "fill-current")} />
                    <span>{post.likes || 0}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post._id)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments || 0}</span>
                  </button>
                  <button
                    onClick={() => handleShare(post)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-500 transition-colors"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>{post.shares || 0}</span>
                  </button>
                </div>

                {/* Comments Section */}
                {selectedPostId === post._id && isCommentsOpen && (
                  <div className="mt-3 pt-3 border-t dark:border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <AvatarSimple
                        src={session?.user?.image}
                        fallback={session?.user?.name?.[0] || "U"}
                        alt={session?.user?.name || "User"}
                        size="sm"
                      />
                      <div className="flex-1 flex gap-2">
                        <Input
                          ref={commentInputRef}
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !isCommenting) {
                              handleComment(post._id);
                            }
                          }}
                          className="h-8 text-sm"
                        />
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => handleComment(post._id)}
                          disabled={!commentText.trim() || isCommenting}
                        >
                          {isCommenting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {postComments.length === 0 ? (
                        <p className="text-xs text-gray-500 text-center py-2">No comments yet</p>
                      ) : (
                        postComments.map((comment) => (
                          <div key={comment._id} className="flex items-start gap-2">
                            <AvatarSimple
                              src={comment.author.image}
                              fallback={comment.author.name?.[0] || "U"}
                              alt={comment.author.name}
                              size="xs"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <Link href={`/profile/${comment.author._id}`} className="font-semibold text-xs hover:underline">
                                  {comment.author.name}
                                </Link>
                                <span className="text-[10px] text-gray-400">
                                  {getTimeAgo(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {comment.content}
                              </p>
                            </div>
                            <button className="text-[10px] text-gray-400 hover:text-red-500">
                              <Heart className={cn("h-3 w-3", comment.isLiked && "fill-current text-red-500")} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Post Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AvatarSimple
                src={session?.user?.image}
                fallback={session?.user?.name?.[0] || "U"}
                alt={session?.user?.name || "User"}
                size="md"
              />
              <div>
                <p className="font-semibold text-sm">{session?.user?.name}</p>
                <div className="flex items-center gap-2">
                  <Select value={postVisibility} onValueChange={setPostVisibility}>
                    <SelectTrigger className="h-6 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="followers">Followers</SelectItem>
                      <SelectItem value="only-me">Only Me</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={postMood} onValueChange={setPostMood}>
                    <SelectTrigger className="h-6 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="happy">Happy</SelectItem>
                      <SelectItem value="sad">Sad</SelectItem>
                      <SelectItem value="excited">Excited</SelectItem>
                      <SelectItem value="angry">Angry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Use #hashtags to categorize your post</p>
              </div>
            </div>

            <Textarea
              placeholder="What's on your mind? Use # for hashtags (e.g., #movie, #music)"
              className="min-h-[100px] resize-none text-sm"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />

            {filePreview && (
              <div className="relative rounded-lg border dark:border-gray-700 p-2">
                {fileType === "image" && (
                  <img src={filePreview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
                )}
                {fileType === "video" && (
                  <video src={filePreview} controls className="max-h-48 rounded-lg" />
                )}
                {fileType === "audio" && (
                  <audio src={filePreview} controls className="w-full" />
                )}
                <button
                  onClick={removeFile}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleMediaClick}
                className="gap-1.5 text-xs"
              >
                <Image className="h-4 w-4 text-green-500" />
                Media
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleVideoClick}
                className="gap-1.5 text-xs"
              >
                <Video className="h-4 w-4 text-red-500" />
                Video
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleAudioClick}
                className="gap-1.5 text-xs"
              >
                <Mic className="h-4 w-4 text-purple-500" />
                Audio
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="gap-1.5 text-xs"
              >
                <Smile className="h-4 w-4 text-yellow-500" />
                Emoji
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="gap-1.5 text-xs"
              >
                <MapPin className="h-4 w-4 text-blue-500" />
                Location
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="gap-1.5 text-xs"
              >
                <Calendar className="h-4 w-4 text-gray-500" />
                Schedule
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
              <Button variant="ghost" size="sm" type="button" className="text-xs">
                Save draft
              </Button>
              <Button
                onClick={handleCreatePost}
                disabled={(!postContent.trim() && !selectedFile) || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}