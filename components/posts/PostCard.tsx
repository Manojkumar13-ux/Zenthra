// components/posts/PostCard.tsx
"use client";

import { useState, useMemo, memo, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarSimple } from "@/components/ui/avatar-simple"; // ✅ Changed to AvatarSimple
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  MoreHorizontal,
  Share2,
  Link as LinkIcon,
  Flag,
  Eye,
  Pin,
  UserX,
  UserMinus,
  Sparkles,
  Play,
  Pause,
  CheckCheck,
  Trash2,
  Copy,
  Clock,
  Verified,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import CommentSection from "./CommentSection";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: any;
  isComment?: boolean;
  onDelete?: () => void;
  onEdit?: () => void;
}

const PostCardComponent = ({ post, isComment = false, onDelete, onEdit }: PostCardProps) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const menuRef = useRef<HTMLDivElement>(null);

  // Post interaction states
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(post.bookmarked || false);
  const [reposted, setReposted] = useState(post.reposted || false);
  const [repostsCount, setRepostsCount] = useState(post.repostsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [isPinned, setIsPinned] = useState(post.isPinned || false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Loading states
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.author?.isFollowing || false);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowActions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Memoized values
  const displayAuthor = useMemo(() => post.author, [post.author]);
  const displayCreatedAt = useMemo(() => post.createdAt, [post.createdAt]);
  const displayMedia = useMemo(() => post.media || [], [post.media]);
  const readingTime = useMemo(
    () => Math.max(1, Math.ceil(post.content?.length / 200)),
    [post.content]
  );
  const viewCount = useMemo(
    () => post.viewsCount || Math.floor(Math.random() * 1000) + 100,
    [post.viewsCount]
  );
  const isOwnPost = session?.user?.id === displayAuthor?._id;

  const contentPreview = useMemo(() => {
    if (post.content?.length <= 280 || showFullContent) {
      return post.content;
    }
    return post.content?.slice(0, 280) + "...";
  }, [post.content, showFullContent]);

  // ============================================
  // FOLLOW HANDLER
  // ============================================
  const handleFollow = async () => {
    if (!session) {
      toast.error("Please login to follow users");
      return;
    }
    if (isOwnPost) {
      toast.error("You cannot follow yourself");
      return;
    }
    if (isFollowingLoading) return;

    const action = isFollowing ? "unfollow" : "follow";
    setIsFollowingLoading(true);

    try {
      const res = await fetch(`/api/users/${displayAuthor._id}/follow?action=${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to follow/unfollow");
      }

      const data = await res.json();
      setIsFollowing(data.isFollowing);
      toast.success(
        data.message ||
          (data.isFollowing
            ? `Following ${displayAuthor.name}`
            : `Unfollowed ${displayAuthor.name}`)
      );

      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (error) {
      console.error("Follow error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update follow status");
    } finally {
      setIsFollowingLoading(false);
    }
  };

  // ============================================
  // LIKE HANDLER
  // ============================================
  const handleLike = async () => {
    if (!session) {
      toast.error("Please login to like");
      return;
    }
    if (isLiking) return;

    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount((prev) => (newLiked ? prev + 1 : prev - 1));
    setIsLiking(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post._id }),
      });

      if (!res.ok) {
        setLiked(!newLiked);
        setLikesCount((prev) => (!newLiked ? prev + 1 : prev - 1));
        const error = await res.json();
        toast.error(error.message || "Failed to like post");
      }
    } catch (error) {
      setLiked(!newLiked);
      setLikesCount((prev) => (!newLiked ? prev + 1 : prev - 1));
      toast.error("Failed to like post");
    } finally {
      setIsLiking(false);
    }
  };

  // ============================================
  // BOOKMARK HANDLER
  // ============================================
  const handleBookmark = async () => {
    if (!session) {
      toast.error("Please login to bookmark");
      return;
    }
    if (isBookmarking) return;

    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);
    setIsBookmarking(true);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post._id }),
      });

      if (!res.ok) {
        setBookmarked(!newBookmarked);
        const error = await res.json();
        toast.error(error.message || "Failed to bookmark");
      } else {
        toast.success(newBookmarked ? "Bookmarked" : "Removed bookmark");
      }
    } catch (error) {
      setBookmarked(!newBookmarked);
      toast.error("Failed to bookmark");
    } finally {
      setIsBookmarking(false);
    }
  };

  // ============================================
  // REPOST HANDLER
  // ============================================
  const handleRepost = async () => {
    if (!session) {
      toast.error("Please login to repost");
      return;
    }
    if (isReposting) return;

    const newReposted = !reposted;
    setReposted(newReposted);
    setRepostsCount((prev) => (newReposted ? prev + 1 : prev - 1));
    setIsReposting(true);

    try {
      const res = await fetch("/api/reposts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post._id }),
      });

      if (!res.ok) {
        setReposted(!newReposted);
        setRepostsCount((prev) => (!newReposted ? prev + 1 : prev - 1));
        const error = await res.json();
        toast.error(error.message || "Failed to repost");
      } else {
        toast.success(newReposted ? "Reposted!" : "Removed repost");
        queryClient.invalidateQueries({ queryKey: ["feed"] });
      }
    } catch (error) {
      setReposted(!newReposted);
      setRepostsCount((prev) => (!newReposted ? prev + 1 : prev - 1));
      toast.error("Failed to repost");
    } finally {
      setIsReposting(false);
    }
  };

  // ============================================
  // SHARE HANDLER
  // ============================================
  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.content || "Zenthra Post",
          text: post.content || "Check out this post on Zenthra!",
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Link copied to clipboard!");
        } catch {
          toast.error("Failed to share");
        }
      }
    }
  };

  // ============================================
  // DELETE HANDLER
  // ============================================
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone."))
      return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete post");
      }

      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["profile-feed"] });
      if (onDelete) onDelete();
      setShowActions(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================
  // TOGGLE ACTIONS MENU
  // ============================================
  const toggleActions = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(!showActions);
  };

  if (isBlocked) {
    return (
      <div className="rounded-xl border bg-card p-4 text-center text-muted-foreground shadow-sm">
        <p>You have blocked this user.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-visible rounded-xl border bg-card shadow-sm transition-all duration-200 hover:shadow-md"
    >
      <div className="p-4">
        {isPinned && (
          <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Pin className="h-3 w-3" />
            Pinned post
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* ✅ Avatar - Using AvatarSimple instead */}
          <Link href={`/profile/${displayAuthor?._id}`}>
            <AvatarSimple
              src={displayAuthor?.image}
              fallback={displayAuthor?.name || "User"}
              alt={displayAuthor?.name || "User"}
              size="md"
            />
          </Link>

          <div className="min-w-0 flex-1">
            {/* Author info with Follow button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Link
                  href={`/profile/${displayAuthor?._id}`}
                  className="flex items-center gap-1 truncate text-sm font-semibold hover:underline"
                >
                  {displayAuthor?.name}
                  {displayAuthor?.verified && (
                    <Verified className="h-4 w-4 flex-shrink-0 fill-blue-500 text-blue-500" />
                  )}
                </Link>
                <span className="truncate text-xs text-muted-foreground">
                  @{displayAuthor?.username}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(displayCreatedAt), { addSuffix: true })}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  {viewCount}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{readingTime}m read</span>

                {post.category && post.category !== "general" && (
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {post.category}
                  </Badge>
                )}
              </div>

              {/* Follow Button */}
              {!isOwnPost && session?.user && (
                <Button
                  variant={isFollowing ? "outline" : "default"}
                  size="sm"
                  onClick={handleFollow}
                  disabled={isFollowingLoading}
                  className="h-7 flex-shrink-0 px-3 text-xs"
                >
                  {isFollowingLoading ? (
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ...
                    </span>
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="mr-1 h-3 w-3" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-1 h-3 w-3" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Post content */}
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">
              {contentPreview}
              {post.content?.length > 280 && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="ml-1 text-sm text-blue-500 hover:underline"
                >
                  {showFullContent ? "Show less" : "Read more"}
                </button>
              )}
            </p>

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {post.hashtags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/explore?q=${tag}`}
                    className="text-sm text-blue-500 hover:underline"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Mood badge */}
            {post.mood && (
              <Badge variant="outline" className="mt-1 text-[10px]">
                {post.mood}
              </Badge>
            )}

            {/* Media gallery */}
            {displayMedia.length > 0 && (
              <div
                className={`mt-2 grid ${displayMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"} gap-1 overflow-hidden rounded-lg`}
              >
                {displayMedia.map((url: string, i: number) => {
                  const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
                  return isVideo ? (
                    <div key={i} className="relative aspect-video bg-black">
                      <video
                        src={url}
                        className="h-full w-full object-cover"
                        controls
                        poster={url.replace(/\.[^.]+$/, ".jpg")}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        className="absolute bottom-2 right-2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                    </div>
                  ) : (
                    <div key={i} className="relative aspect-square">
                      <img
                        src={url}
                        alt="media"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Summary */}
            {post.aiSummary && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-primary/5 p-2">
                <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">{post.aiSummary}</p>
              </div>
            )}

            {/* Poll */}
            {post.poll && post.poll.options && (
              <div className="mt-3 rounded-lg bg-muted/30 p-3">
                <p className="mb-2 text-sm font-medium">{post.poll.question || "Poll"}</p>
                {post.poll.options.map((option: any, idx: number) => (
                  <div key={idx} className="relative mb-1">
                    <div
                      className="flex h-8 items-center rounded bg-primary/20 px-3"
                      style={{
                        width: `${(option.votes / (post.poll.totalVotes || 1)) * 100 || 0}%`,
                      }}
                    >
                      <span className="text-sm">{option.text}</span>
                    </div>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {Math.round((option.votes / (post.poll.totalVotes || 1)) * 100 || 0)}%
                    </span>
                  </div>
                ))}
                <p className="mt-1 text-xs text-muted-foreground">
                  {post.poll.totalVotes || 0} votes
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-3 flex items-center justify-between border-t pt-2">
              <div className="flex items-center gap-1">
                {/* Like Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking}
                  className={cn("h-8 gap-1 px-2 hover:text-red-500", liked && "text-red-500")}
                >
                  <Heart className={cn("h-4 w-4", liked && "fill-red-500")} />
                  {likesCount > 0 && <span className="text-xs">{likesCount}</span>}
                </Button>

                {/* Comment Button */}
                {!isComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComments(!showComments)}
                    className="h-8 gap-1 px-2 hover:text-blue-500"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.commentsCount > 0 && (
                      <span className="text-xs">{post.commentsCount}</span>
                    )}
                  </Button>
                )}

                {/* Repost Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRepost}
                  disabled={isReposting}
                  className={cn(
                    "h-8 gap-1 px-2 hover:text-green-500",
                    reposted && "text-green-500"
                  )}
                >
                  <Repeat2 className={cn("h-4 w-4", reposted && "fill-green-500")} />
                  {repostsCount > 0 && <span className="text-xs">{repostsCount}</span>}
                </Button>
              </div>

              <div className="flex items-center gap-1">
                {/* Bookmark Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  disabled={isBookmarking}
                  className={cn("h-8 px-2 hover:text-indigo-500", bookmarked && "text-indigo-500")}
                >
                  <Bookmark className={cn("h-4 w-4", bookmarked && "fill-indigo-500")} />
                </Button>

                {/* Share Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="h-8 px-2 hover:text-blue-500"
                >
                  <Share2 className="h-4 w-4" />
                </Button>

                {/* 3-Dot Menu */}
                <div className="relative" ref={menuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleActions}
                    className="h-8 px-2"
                    type="button"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>

                  {/* Dropdown Menu */}
                  {showActions && (
                    <div
                      className="absolute right-0 z-[9999] mt-2 w-56 min-w-[180px] rounded-lg border bg-white py-1 shadow-2xl dark:border-gray-700 dark:bg-gray-800"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: "0",
                        zIndex: 9999,
                        boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
                      }}
                    >
                      {/* Own post options */}
                      {isOwnPost && (
                        <>
                          <button
                            onClick={() => {
                              setIsPinned(!isPinned);
                              toast.success(isPinned ? "Unpinned" : "Pinned!");
                              setShowActions(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Pin className="h-4 w-4" />
                            {isPinned ? "Unpin" : "Pin"}
                          </button>
                          {onEdit && (
                            <button
                              onClick={() => {
                                onEdit();
                                setShowActions(false);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <CheckCheck className="h-4 w-4" />
                              Edit
                            </button>
                          )}
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="h-4 w-4" />
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                          <hr className="my-1 dark:border-gray-700" />
                        </>
                      )}

                      {/* Common options */}
                      <button
                        onClick={() => {
                          handleShare();
                          setShowActions(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                        Copy link
                      </button>
                      <button
                        onClick={() => {
                          window.open(`/post/${post._id}`, "_blank");
                          setShowActions(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <LinkIcon className="h-4 w-4" />
                        Open post
                      </button>
                      <hr className="my-1 dark:border-gray-700" />
                      <button
                        onClick={() => {
                          toast.success("Reported successfully");
                          setShowActions(false);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Flag className="h-4 w-4" />
                        Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <AnimatePresence>
        {showComments && !isComment && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t"
          >
            <div className="p-4">
              <CommentSection postId={post._id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default memo(PostCardComponent);
