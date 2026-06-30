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
  Plus,
  TrendingUp,
  UserPlus,
  Film,
  Trophy,
  Database,
  Music,
  Gamepad2,
  Briefcase,
  GraduationCap,
  Cloud,
  Wind,
  Droplets,
  Clock,
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

// ============================================
// Types
// ============================================
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
  mood?: string;
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

interface Trend {
  id: string;
  title: string;
  posts: number;
  category: string;
}

interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  image: string;
  bio: string;
  mutualFollowers: number;
}

// ============================================
// Constants
// ============================================
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
};

const categories = [
  { name: "Movies", icon: Film },
  { name: "Sports", icon: Trophy },
  { name: "Technology", icon: Database },
  { name: "Music", icon: Music },
  { name: "Gaming", icon: Gamepad2 },
  { name: "Business", icon: Briefcase },
  { name: "Education", icon: GraduationCap },
];

// ============================================
// Helper Functions
// ============================================
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

const getTimeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

// ============================================
// Main Component
// ============================================
export default function FeedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Post states
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create post states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postVisibility, setPostVisibility] = useState("everyone");
  const [postMood, setPostMood] = useState("neutral");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"image" | "video" | "audio" | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof typeof TAB_DISPLAY>("for-you");
  
  // Comment states
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Right sidebar states
  const [trends, setTrends] = useState<Trend[]>([
    { id: "1", title: "#ZenthraLaunch", posts: 1234, category: "Tech" },
    { id: "2", title: "#SummerVibes", posts: 856, category: "Lifestyle" },
    { id: "3", title: "#AIRevolution", posts: 642, category: "Technology" },
    { id: "4", title: "#MovieNight", posts: 521, category: "Entertainment" },
    { id: "5", title: "#FitnessGoals", posts: 398, category: "Health" },
  ]);
  
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([
    { id: "1", name: "Alice Johnson", username: "alicej", image: "", bio: "Tech enthusiast", mutualFollowers: 5 },
    { id: "2", name: "Bob Smith", username: "bobsmith", image: "", bio: "Photographer", mutualFollowers: 3 },
    { id: "3", name: "Carol White", username: "carolw", image: "", bio: "Travel blogger", mutualFollowers: 7 },
  ]);

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // Fetch Posts
  // ============================================
  const fetchPosts = useCallback(async (silent: boolean = false) => {
    if (!silent) {
      setIsLoading(true);
    }
    try {
      const res = await fetch("/api/posts?limit=100");
      
      if (res.ok) {
        const data = await res.json();
        const allPosts = data.posts || [];
        const sortedPosts = allPosts.sort((a: Post, b: Post) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPosts(sortedPosts);
        setFilteredPosts(sortedPosts);
        return sortedPosts;
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch suggested users
  const fetchSuggestedUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users/suggested");
      if (res.ok) {
        const data = await res.json();
        setSuggestedUsers(data.users || []);
      }
    } catch (error) {
      console.error("Failed to fetch suggested users:", error);
    }
  }, []);

  // Fetch trends
  const fetchTrends = useCallback(async () => {
    try {
      const res = await fetch("/api/trends");
      if (res.ok) {
        const data = await res.json();
        setTrends(data.trends || []);
      }
    } catch (error) {
      console.error("Failed to fetch trends:", error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (status === "authenticated") {
      fetchPosts();
      fetchSuggestedUsers();
      fetchTrends();
    }
  }, [status, fetchPosts, fetchSuggestedUsers, fetchTrends]);

  // ============================================
  // Comments Functions
  // ============================================
  const fetchComments = useCallback(async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({ ...prev, [postId]: data.comments || [] }));
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
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
      await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
    setPosts(prev => prev.filter(post => post._id !== postId));
    setFilteredPosts(prev => prev.filter(post => post._id !== postId));
    toast.success("Post deleted");
  }, []);

  const handleShare = useCallback((post: Post) => {
    const url = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard?.writeText(url).then(() => {
      toast.success("Link copied!");
    }).catch(() => {
      toast.success("Share: " + url);
    });
  }, []);

  const handleBookmark = useCallback(() => {
    toast.success("Saved to bookmarks!");
  }, []);

  const handleReport = useCallback(() => {
    toast.success("Reported. We'll review it.");
  }, []);

  const handleHashtagClick = useCallback((tag: string) => {
    const cleanTag = tag.startsWith("#") ? tag.slice(1) : tag;
    router.push(`/explore?q=${encodeURIComponent(cleanTag)}`);
  }, [router]);

  const handleFollowUser = useCallback((userId: string) => {
    toast.success("Followed user!");
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

  const resetCreateForm = useCallback(() => {
    setPostContent("");
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    setIsCreateOpen(false);
  }, []);

  // ============================================
  // Create Post - FIXED TypeScript Error
  // ============================================
  const handleCreatePost = useCallback(async () => {
    if (!postContent.trim() && !selectedFile) {
      toast.error("Please write something or add media");
      return;
    }

    setIsSubmitting(true);
    try {
      const hashtags = extractHashtags(postContent);
      const category = detectCategory(hashtags);

      // ✅ FIX: Convert null to undefined for image and video
      const imageValue = fileType === "image" && filePreview ? filePreview : undefined;
      const videoValue = fileType === "video" && filePreview ? filePreview : undefined;

      // Create the post object
      const newPost: Post = {
        _id: `temp_${Date.now()}`,
        content: postContent,
        author: {
          _id: session?.user?.id || "1",
          id: session?.user?.id || "1",
          name: session?.user?.name || "You",
          username: session?.user?.username || "you",
          image: session?.user?.image || "",
        },
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date().toISOString(),
        isLiked: false,
        visibility: postVisibility as any,
        hashtags: hashtags,
        category: category,
        image: imageValue,
        video: videoValue,
        mood: postMood,
      };

      // IMMEDIATELY show the post
      setPosts(prev => [newPost, ...prev]);
      setFilteredPosts(prev => [newPost, ...prev]);
      resetCreateForm();
      toast.success("✅ Post created!");

      // Try to save to database in background
      try {
        const postData = {
          content: postContent,
          visibility: postVisibility,
          mood: postMood,
          image: fileType === "image" && filePreview ? filePreview : null,
          video: fileType === "video" && filePreview ? filePreview : null,
          hashtags: hashtags,
          category: category,
        };

        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
        });

        if (res.ok) {
          const data = await res.json();
          // Replace temp post with real one from server
          setPosts(prev => 
            prev.map(p => 
              p._id === newPost._id ? data.post : p
            )
          );
          setFilteredPosts(prev => 
            prev.map(p => 
              p._id === newPost._id ? data.post : p
            )
          );
          console.log("✅ Post saved to database");
        }
      } catch (error) {
        console.warn("⚠️ Background save failed:", error);
      }

    } catch (error) {
      console.error("❌ Failed to create post:", error);
      toast.error("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  }, [postContent, selectedFile, fileType, filePreview, postVisibility, postMood, session, resetCreateForm]);

  const getTabDisplay = useCallback((tab: string) => {
    return TAB_DISPLAY[tab as keyof typeof TAB_DISPLAY] || "For You";
  }, []);

  // ============================================
  // Render
  // ============================================
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
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Hidden file inputs */}
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

      {/* ===== MAIN FEED ===== */}
      <div className="flex-1 min-w-0">
        {/* Create Post Box */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4 mb-4">
          <div className="flex items-center gap-3">
            <AvatarSimple
              src={session?.user?.image}
              fallback={session?.user?.name?.[0] || "U"}
              alt={session?.user?.name || "User"}
              size="sm"
            />
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex-1 text-left text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-2 px-4 bg-gray-100 dark:bg-gray-800 rounded-full text-sm"
            >
              What's on your mind? Use #hashtags
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t dark:border-gray-800">
            <button
              onClick={handleMediaClick}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Image className="h-4 w-4 text-green-500" />
              <span>Media</span>
            </button>
            <button
              onClick={handleVideoClick}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Video className="h-4 w-4 text-red-500" />
              <span>Video</span>
            </button>
            <button
              onClick={handleAudioClick}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Mic className="h-4 w-4 text-purple-500" />
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
                "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              {getTabDisplay(tab)}
            </button>
          ))}
        </div>

        {/* Post count */}
        <div className="text-xs text-gray-500 mb-3">
          {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
        </div>

        {/* Posts list */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No posts yet</h3>
            <p className="text-sm text-gray-500 mt-1">Be the first to post!</p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => {
              if (!post?.author) return null;
              const author = post.author;
              const postComments = comments[post._id] || [];
              const isAuthor = author._id === session?.user?.id || author.id === session?.user?.id;
              const isTemp = post._id.startsWith("temp_");
              
              return (
                <div 
                  key={post._id} 
                  className={cn(
                    "bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4",
                    isTemp && "border-blue-300 dark:border-blue-700"
                  )}
                >
                  {isTemp && (
                    <div className="mb-2">
                      <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-300">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Saving...
                      </Badge>
                    </div>
                  )}

                  {post.category && post.category !== "General" && (
                    <div className="mb-2">
                      <Badge variant="outline" className="text-[10px] px-2 py-0">
                        {post.category}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <AvatarSimple
                        src={author.image}
                        fallback={author.name?.[0] || "U"}
                        alt={author.name || "User"}
                        size="sm"
                      />
                      <div>
                        <Link href={`/profile/${author._id || author.id}`} className="font-semibold text-sm hover:underline">
                          {author.name || "Unknown User"}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span>@{author.username || "user"}</span>
                          <span>·</span>
                          <span>{getTimeAgo(post.createdAt)}</span>
                          {post.visibility === "everyone" && <Globe className="h-3 w-3" />}
                          {post.mood && post.mood !== "neutral" && (
                            <span className="text-xs">
                              {post.mood === "happy" && "😊"}
                              {post.mood === "sad" && "😢"}
                              {post.mood === "excited" && "🤩"}
                              {post.mood === "angry" && "😤"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
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
                          toast.success("Copied!");
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
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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
                          alt="Post"
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
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.hashtags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => handleHashtagClick(tag)}
                            className="text-xs text-blue-500 hover:underline bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>{post.likes || 0} likes</span>
                    <span>{post.comments || 0} comments</span>
                    <span>{post.shares || 0} shares</span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t dark:border-gray-800">
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

                  {/* Comments */}
                  {selectedPostId === post._id && isCommentsOpen && (
                    <div className="mt-3 pt-3 border-t dark:border-gray-800">
                      <div className="flex items-center gap-2 mb-2">
                        <AvatarSimple
                          src={session?.user?.image}
                          fallback={session?.user?.name?.[0] || "U"}
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
      </div>

      {/* ===== RIGHT SIDEBAR ===== */}
      <aside className="hidden lg:block w-80 flex-shrink-0">
        <div className="sticky top-4 space-y-4">
          {/* Trending Section */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Trending
            </h3>
            <div className="space-y-3">
              {trends.map((trend) => (
                <Link
                  key={trend.id}
                  href={`/explore?q=${encodeURIComponent(trend.title)}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">
                        {trend.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {trend.posts.toLocaleString()} posts
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {trend.category}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Suggested Users */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <UserPlus className="h-5 w-5 text-blue-500" />
              Suggested for you
            </h3>
            <div className="space-y-3">
              {suggestedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <AvatarSimple
                    src={user.image}
                    fallback={user.name[0]}
                    alt={user.name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{user.username}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {user.mutualFollowers} mutual followers
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 px-3"
                    onClick={() => handleFollowUser(user.id)}
                  >
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Categories
            </h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  href={`/explore?category=${category.name.toLowerCase()}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <category.icon className="h-3 w-3" />
                  {category.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Weather / Today */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border dark:border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              <Clock className="h-4 w-4 inline mr-2 text-blue-500" />
              Today
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 dark:text-gray-300">28°C</span>
                <span className="text-gray-500 dark:text-gray-400">Partly cloudy</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Wind className="h-3 w-3" /> 12 km/h
                </span>
                <span className="flex items-center gap-1">
                  <Droplets className="h-3 w-3" /> 65%
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== CREATE POST DIALOG ===== */}
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
                      <SelectItem value="neutral">😐 Neutral</SelectItem>
                      <SelectItem value="happy">😊 Happy</SelectItem>
                      <SelectItem value="sad">😢 Sad</SelectItem>
                      <SelectItem value="excited">🤩 Excited</SelectItem>
                      <SelectItem value="angry">😤 Angry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Use #hashtags to categorize</p>
              </div>
            </div>

            <Textarea
              placeholder="What's on your mind? Use # for hashtags"
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
              <Button variant="outline" size="sm" onClick={handleMediaClick} className="gap-1.5 text-xs">
                <Image className="h-4 w-4 text-green-500" />
                Media
              </Button>
              <Button variant="outline" size="sm" onClick={handleVideoClick} className="gap-1.5 text-xs">
                <Video className="h-4 w-4 text-red-500" />
                Video
              </Button>
              <Button variant="outline" size="sm" onClick={handleAudioClick} className="gap-1.5 text-xs">
                <Mic className="h-4 w-4 text-purple-500" />
                Audio
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Smile className="h-4 w-4 text-yellow-500" />
                Emoji
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <MapPin className="h-4 w-4 text-blue-500" />
                Location
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Calendar className="h-4 w-4 text-gray-500" />
                Schedule
              </Button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t dark:border-gray-700">
              <Button variant="ghost" size="sm" className="text-xs">
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