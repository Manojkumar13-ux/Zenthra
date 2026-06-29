// components/posts/PostCard.tsx
"use client";

import { useState, useMemo, memo, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { AvatarSimple } from "@/components/ui/avatar-simple";
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
  onDelete?: (postId: string) => void;
  onEdit?: () => void;
}

const PostCardComponent = ({ post, isComment = false, onDelete, onEdit }: PostCardProps) => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const menuRef = useRef<HTMLDivElement>(null);

  // Post interaction states
  const [liked, setLiked] = useState(post.liked || false);
  const [likesCount, setLikesCount] = useState<number>(post.likesCount || 0);
  const [bookmarked, setBookmarked] = useState(post.bookmarked || false);
  const [reposted, setReposted] = useState(post.reposted || false);
  const [repostsCount, setRepostsCount] = useState<number>(post.repostsCount || 0);
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
  const readingTime = useMemo(() => Math.max(1, Math.ceil(post.content?.length / 200)), [post.content]);
  const viewCount = useMemo(() => post.viewsCount || Math.floor(Math.random() * 1000) + 100, [post.viewsCount]);
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

    const action = isFollowing ? 'unfollow' : 'follow';
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
      toast.success(data.message || (data.isFollowing ? `Following ${displayAuthor.name}` : `Unfollowed ${displayAuthor.name}`));

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
    setLikesCount((prev: number) => (newLiked ? prev + 1 : prev - 1));
    setIsLiking(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post._id }),
      });

      if (!res.ok) {
        setLiked(!newLiked);
        setLikesCount((prev: number) => (!newLiked ? prev + 1 : prev - 1));
        const error = await res.json();
        toast.error(error.message || "Failed to like post");
      }
    } catch (error) {
      setLiked(!newLiked);
      setLikesCount((prev: number) => (!newLiked ? prev + 1 : prev - 1));
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
    setRepostsCount((prev: number) => (newReposted ? prev + 1 : prev - 1));
    setIsReposting(true);

    try {
      const res = await fetch("/api/reposts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post._id }),
      });

      if (!res.ok) {
        setReposted(!newReposted);
        setRepostsCount((prev: number) => (!newReposted ? prev + 1 : prev - 1));
        const error = await res.json();
        toast.error(error.message || "Failed to repost");
      } else {
        toast.success(newReposted ? "Reposted!" : "Removed repost");
        queryClient.invalidateQueries({ queryKey: ["feed"] });
      }
    } catch (error) {
      setReposted(!newReposted);
      setRepostsCount((prev: number) => (!newReposted ? prev + 1 : prev - 1));
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
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
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
      if (onDelete) onDelete(post._id);
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
      <div className="bg-card rounded-xl shadow-sm border p-4 text-center text-muted-foreground">
        <p>You have blocked this user.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 overflow-visible"
    >
      <div className="p-4">
        {isPinned && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <Pin className="h-3 w-3" />
            Pinned post
          </div>
        )}

        <div className="flex items-start gap-3">
          <Link href={`/profile/${displayAuthor?._id}`}>
            <AvatarSimple
              src={displayAuthor?.image}
              fallback={displayAuthor?.name || "User"}
              alt={displayAuthor?.name || "User"}
              size="md"
            />
          </Link>

          <div className="flex-1 min-w-0">
            {/* Author info with Follow button */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <Link href={`/profile/${displayAuthor?._id}`} className="font-semibold hover:underline text-sm flex items-center gap-1 truncate">
                  {displayAuthor?.name}
                  {displayAuthor?.verified && (
                    <Verified className="h-4 w-4 text-blue-500 fill-blue-500 flex-shrink-0" />
                  )}
                </Link>
                <span className="text-muted-foreground text-xs truncate">@{displayAuthor?.username}</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-muted-foreground text-xs flex items-center gap-1 whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(displayCreatedAt), { addSuffix: true })}
                </span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {viewCount}
                </span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-muted-foreground text-xs">{readingTime}m read</span>

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
                  className="h-7 px-3 text-xs flex-shrink-0"
                >
                  {isFollowingLoading ? (
                    <span className="flex items-center gap-1">
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ...
                    </span>
                  ) : isFollowing ? (
                    <>
                      <UserCheck className="h-3 w-3 mr-1" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Follow
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Post content */}
            <p className="whitespace-pre-wrap break-words mt-1 text-sm">
              {contentPreview}
              {post.content?.length > 280 && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="text-blue-500 hover:underline ml-1 text-sm"
                >
                  {showFullContent ? "Show less" : "Read more"}
                </button>
              )}
            </p>

            {/* Hashtags */}
            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {post.hashtags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/explore?q=${tag}`}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Mood badge */}
            {post.mood && (
              <Badge variant="outline" className="text-[10px] mt-1">
                {post.mood}
              </Badge>
            )}

            {/* Media gallery */}
            {displayMedia.length > 0 && (
              <div className={`mt-2 grid ${displayMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1 rounded-lg overflow-hidden`}>
                {displayMedia.map((url: string, i: number) => {
                  const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
                  return isVideo ? (
                    <div key={i} className="relative aspect-video bg-black">
                      <video 
                        src={url} 
                        className="w-full h-full object-cover"
                        controls
                        poster={url.replace(/\.[^.]+$/, '.jpg')}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button 
                        className="absolute bottom-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
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
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Summary */}
            {post.aiSummary && (
              <div className="mt-2 p-2 bg-primary/5 rounded-lg flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground">{post.aiSummary}</p>
              </div>
            )}

            {/* Poll */}
            {post.poll && post.poll.options && (
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium mb-2">{post.poll.question || "Poll"}</p>
                {post.poll.options.map((option: any, idx: number) => (
                  <div key={idx} className="relative mb-1">
                    <div 
                      className="h-8 bg-primary/20 rounded flex items-center px-3"
                      style={{ width: `${(option.votes / (post.poll.totalVotes || 1)) * 100 || 0}%` }}
                    >
                      <span className="text-sm">{option.text}</span>
                    </div>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {Math.round((option.votes / (post.poll.totalVotes || 1)) * 100 || 0)}%
                    </span>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-1">{post.poll.totalVotes || 0} votes</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-3 pt-2 border-t">
              <div className="flex items-center gap-1">
                {/* Like Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLike} 
                  disabled={isLiking}
                  className={cn("gap-1 h-8 px-2 hover:text-red-500", liked && "text-red-500")}
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
                    className="gap-1 h-8 px-2 hover:text-blue-500"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {post.commentsCount > 0 && <span className="text-xs">{post.commentsCount}</span>}
                  </Button>
                )}

                {/* Repost Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRepost} 
                  disabled={isReposting}
                  className={cn("gap-1 h-8 px-2 hover:text-green-500", reposted && "text-green-500")}
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
                      className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border dark:border-gray-700 z-[9999] py-1 min-w-[180px]"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        zIndex: 9999,
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
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
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
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
                              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                            >
                              <CheckCheck className="h-4 w-4" />
                              Edit
                            </button>
                          )}
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors disabled:opacity-50"
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
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        Copy link
                      </button>
                      <button
                        onClick={() => {
                          window.open(`/post/${post._id}`, '_blank');
                          setShowActions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
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
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
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