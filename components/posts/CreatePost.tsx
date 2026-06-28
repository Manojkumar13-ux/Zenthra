// components/posts/CreatePost.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Image as ImageIcon,
  Smile,
  MapPin,
  Calendar,
  Globe,
  Users,
  AtSign,
  X,
  Loader2,
  Send,
  Save,
  Film,
  Music,
  BarChart3,
  Sparkles,
  RefreshCw,
  Languages
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

// Types
type AudienceType = "everyone" | "followers" | "mentioned";
type MoodType = "neutral" | "happy" | "excited" | "sad" | "angry" | "thoughtful" | "funny" | "inspirational";

interface CreatePostProps {
  onPostCreated?: () => void;
  onSaveDraft?: (content: string) => void;
  communityId?: string;
  placeholder?: string;
}

const MAX_CHARS = 280;

const moodEmojis: Record<MoodType, string> = {
  neutral: "😐",
  happy: "😊",
  excited: "🤩",
  sad: "😢",
  angry: "😤",
  thoughtful: "🤔",
  funny: "😂",
  inspirational: "💫",
};

export default function CreatePost({ 
  onPostCreated, 
  onSaveDraft, 
  communityId,
  placeholder = "What's on your mind? Use # for hashtags and @ for mentions"
}: CreatePostProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<string[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audience, setAudience] = useState<AudienceType>("everyone");
  const [mood, setMood] = useState<MoodType>("neutral");
  const [location, setLocation] = useState("");
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [isScheduled, setIsScheduled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [extractedHashtags, setExtractedHashtags] = useState<string[]>([]);
  const [extractedMentions, setExtractedMentions] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState(24);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const savedDraft = localStorage.getItem("postDraft");
    if (savedDraft) {
      setContent(savedDraft);
      setCharCount(savedDraft.length);
      setIsDraft(true);
    }
  }, []);

  useEffect(() => {
    const hashtags = content.match(/#[\w]+/g) || [];
    const mentions = content.match(/@[\w]+/g) || [];
    setExtractedHashtags(hashtags.map(tag => tag.substring(1)));
    setExtractedMentions(mentions.map(mention => mention.substring(1)));
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARS) {
      setContent(text);
      setCharCount(text.length);
      localStorage.setItem("postDraft", text);
      setIsDraft(text.length > 0);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    const newContent = content + emoji.native;
    if (newContent.length <= MAX_CHARS) {
      setContent(newContent);
      setCharCount(newContent.length);
      localStorage.setItem("postDraft", newContent);
      setIsDraft(true);
    }
    setShowEmojiPicker(false);
  };

  const triggerFileUpload = (type: "image" | "video" | "audio") => {
    if (type === "image" && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (type === "video" && videoInputRef.current) {
      videoInputRef.current.click();
    } else if (type === "audio" && audioInputRef.current) {
      audioInputRef.current.click();
    }
  };

  const handleFileUpload = async (files: FileList, type: "image" | "video" | "audio") => {
    if (!files || files.length === 0) {
      toast.error("No files selected");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        
        setUploadProgress(((i + 1) / files.length) * 50);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || `Failed to upload ${file.name}`);
        }

        const data = await res.json();
        if (data.url) {
          uploadedUrls.push(data.url);
          setMedia((prev) => [...prev, data.url]);
        }
        
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      toast.success(`${uploadedUrls.length} file(s) uploaded successfully!`);
      
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
      
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload files");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files, "image");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeMedia = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleRemovePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const handleAIWrite = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Please write some content first");
      return;
    }
    
    toast.loading("AI is writing...");
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) throw new Error("Failed to rewrite");
      
      const data = await res.json();
      setContent(data.content);
      setCharCount(data.content.length);
      toast.success("Rewritten by AI!");
    } catch (error) {
      toast.error("Failed to rewrite");
    } finally {
      toast.dismiss();
    }
  }, [content]);

  const handleAIHashtags = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Please write some content first");
      return;
    }
    
    toast.loading("Generating hashtags...");
    try {
      const res = await fetch("/api/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) throw new Error("Failed to generate hashtags");
      
      const data = await res.json();
      const hashtags = data.hashtags.map((tag: string) => `#${tag}`).join(" ");
      setContent(prev => prev + " " + hashtags);
      setCharCount(prev => prev + hashtags.length);
      toast.success("Hashtags added!");
    } catch (error) {
      toast.error("Failed to generate hashtags");
    } finally {
      toast.dismiss();
    }
  }, [content]);

  const handleAISummarize = useCallback(async () => {
    if (!content.trim()) {
      toast.error("Please write some content first");
      return;
    }
    
    toast.loading("Summarizing...");
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!res.ok) throw new Error("Failed to summarize");
      
      const data = await res.json();
      setContent(data.summary);
      setCharCount(data.summary.length);
      toast.success("Summarized by AI!");
    } catch (error) {
      toast.error("Failed to summarize");
    } finally {
      toast.dismiss();
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      toast.error("Please login to create a post");
      return;
    }

    if (!content.trim() && media.length === 0) {
      toast.error("Please write something or add media");
      return;
    }

    setLoading(true);
    try {
      // Extract hashtags from content
      const hashtags = content.match(/#[\w]+/g) || [];
      const mentions = content.match(/@[\w]+/g) || [];

      const postData = {
        content: content.trim(),
        media: media,
        audience: audience,
        mood: mood,
        location: location || undefined,
        scheduledAt: isScheduled && scheduleDate ? scheduleDate.toISOString() : undefined,
        hashtags: hashtags,
        mentions: mentions,
        communityId: communityId || undefined,
        poll: showPoll ? {
          options: pollOptions.filter(o => o.trim()),
          duration: pollDuration,
        } : undefined,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create post");
      }

      toast.success(isScheduled ? "Post scheduled!" : "Post created!");
      
      // Reset form
      setContent("");
      setCharCount(0);
      setMedia([]);
      setMediaFiles([]);
      setLocation("");
      setScheduleDate(undefined);
      setIsScheduled(false);
      setExtractedHashtags([]);
      setExtractedMentions([]);
      setPollOptions(["", ""]);
      setShowPoll(false);
      localStorage.removeItem("postDraft");
      setIsDraft(false);
      
      // Invalidate queries to refresh feed
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profile-feed"] });
      queryClient.invalidateQueries({ queryKey: ["explore"] });
      
      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("CreatePost error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = () => {
    if (content.trim()) {
      localStorage.setItem("postDraft", content);
      setIsDraft(true);
      toast.success("Draft saved!");
      if (onSaveDraft) onSaveDraft(content);
    } else {
      toast.error("Nothing to save");
    }
  };

  const clearDraft = () => {
    localStorage.removeItem("postDraft");
    setContent("");
    setCharCount(0);
    setIsDraft(false);
    toast.success("Draft cleared");
  };

  if (!mounted || !session) return null;

  const charPercentage = (charCount / MAX_CHARS) * 100;
  const isNearLimit = charCount > MAX_CHARS * 0.8;
  const isOverLimit = charCount >= MAX_CHARS;

  const moodColors: Record<MoodType, string> = {
    neutral: "border-gray-300",
    happy: "border-yellow-400",
    excited: "border-purple-400",
    sad: "border-blue-400",
    angry: "border-red-400",
    thoughtful: "border-indigo-400",
    funny: "border-green-400",
    inspirational: "border-pink-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-gray-900 rounded-xl shadow-sm border p-4 hover:shadow-md transition-all duration-200",
        moodColors[mood]
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={session.user?.image || ""} />
            <AvatarFallback>{session.user?.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{session.user?.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span>@{session.user?.username || session.user?.email?.split("@")[0]}</span>
              <Badge variant="outline" className="text-[10px] capitalize">
                {audience}
              </Badge>
              {communityId && (
                <Badge variant="secondary" className="text-[10px]">
                  Community
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-[10px]">
              {moodEmojis[mood]} {mood}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <Textarea
            placeholder={placeholder}
            value={content}
            onChange={handleContentChange}
            className="resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-base min-h-[80px]"
            rows={3}
            disabled={loading || uploading}
          />
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {charCount > 0 && (
              <span className={cn(
                isNearLimit ? "text-yellow-500" : "",
                isOverLimit ? "text-red-500" : ""
              )}>
                {charCount}/{MAX_CHARS}
              </span>
            )}
          </div>
        </div>

        {/* Hashtag and mention hints */}
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span>💡 Use # for hashtags</span>
          <span>·</span>
          <span>@ for mentions</span>
          {extractedHashtags.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {extractedHashtags.length} hashtags
            </Badge>
          )}
          {extractedMentions.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {extractedMentions.length} mentions
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        {charCount > 0 && (
          <div className="mt-1">
            <Progress 
              value={charPercentage} 
              className={cn(
                "h-1",
                isOverLimit ? "bg-red-200" : isNearLimit ? "bg-yellow-200" : ""
              )}
            />
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Uploading...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}

        {/* Media preview */}
        {media.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {media.map((url, index) => (
              <div key={index} className="relative group aspect-square">
                {url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video src={url} className="w-full h-full object-cover rounded-lg" />
                ) : url.match(/\.(mp3|wav|ogg|aac)$/i) ? (
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <Music className="h-8 w-8 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`Media ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeMedia(index)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Poll */}
        {showPoll && (
          <div className="mt-3 p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Poll</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPoll(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {pollOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  className="flex-1 p-2 text-sm border rounded"
                />
                {pollOptions.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePollOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPollOption}
              >
                Add option
              </Button>
            )}
            <div className="mt-2">
              <label className="text-sm text-muted-foreground">Poll duration (hours)</label>
              <input
                type="number"
                value={pollDuration}
                onChange={(e) => setPollDuration(parseInt(e.target.value) || 24)}
                className="w-full p-2 text-sm border rounded mt-1"
                min={1}
                max={168}
              />
            </div>
          </div>
        )}

        {/* Drag drop overlay */}
        {isDragging && (
          <div className="mt-3 border-2 border-dashed border-primary rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">Drop your images here</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="mt-3 flex items-center gap-1 flex-wrap border-t pt-3 dark:border-gray-700">
          {/* Media buttons */}
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => triggerFileUpload("image")}
            disabled={uploading}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            Media
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files, "image");
              }
            }}
            disabled={uploading}
          />

          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => triggerFileUpload("video")}
            disabled={uploading}
          >
            <Film className="h-4 w-4 mr-1" />
            Video
          </Button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files, "video");
              }
            }}
            disabled={uploading}
          />

          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => triggerFileUpload("audio")}
            disabled={uploading}
          >
            <Music className="h-4 w-4 mr-1" />
            Audio
          </Button>
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files, "audio");
              }
            }}
            disabled={uploading}
          />

          {/* Poll */}
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowPoll(!showPoll)}
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Poll
          </Button>

          {/* Emoji picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <Smile className="h-4 w-4 mr-1" />
                Emoji
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <Picker 
                data={data} 
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
              />
            </PopoverContent>
          </Popover>

          {/* Location */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <MapPin className="h-4 w-4 mr-1" />
                {location || "Location"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <input
                type="text"
                placeholder="Enter location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </PopoverContent>
          </Popover>

          {/* Schedule */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <Calendar className="h-4 w-4 mr-1" />
                {scheduleDate ? format(scheduleDate, "MMM d") : "Schedule"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <input
                type="datetime-local"
                className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                onChange={(e) => {
                  if (e.target.value) {
                    setScheduleDate(new Date(e.target.value));
                    setIsScheduled(true);
                  }
                }}
              />
              {scheduleDate && (
                <div className="mt-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setIsScheduled(!isScheduled);
                      toast.success(isScheduled ? "Schedule removed" : "Post scheduled!");
                    }}
                    className="w-full"
                  >
                    {isScheduled ? "Remove schedule" : "Confirm schedule"}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Audience */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                {audience === "everyone" && <Globe className="h-4 w-4 mr-1" />}
                {audience === "followers" && <Users className="h-4 w-4 mr-1" />}
                {audience === "mentioned" && <AtSign className="h-4 w-4 mr-1" />}
                {audience.charAt(0).toUpperCase() + audience.slice(1)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-1">
                {[
                  { value: "everyone", label: "Everyone", icon: Globe },
                  { value: "followers", label: "Followers Only", icon: Users },
                  { value: "mentioned", label: "Mentioned Users", icon: AtSign },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAudience(option.value as AudienceType)}
                    className={`w-full text-left px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 ${
                      audience === option.value ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Mood */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                {moodEmojis[mood]} {mood}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(moodEmojis).map(([key, emoji]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMood(key as MoodType)}
                    className={`p-2 text-sm rounded hover:bg-muted ${
                      mood === key ? "bg-primary/10 text-primary" : ""
                    }`}
                  >
                    {emoji} {key}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* AI Tools */}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAIWrite}
              disabled={!content.trim() || loading}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              AI Rewrite
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAIHashtags}
              disabled={!content.trim() || loading}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              AI Hashtags
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAISummarize}
              disabled={!content.trim() || loading}
            >
              <Languages className="h-4 w-4 mr-1" />
              AI Summarize
            </Button>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {isDraft && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearDraft}
                className="text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4 mr-1" />
                Clear draft
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={saveDraft}
              disabled={!content.trim()}
            >
              <Save className="h-4 w-4 mr-1" />
              Save draft
            </Button>
          </div>
          <Button 
            type="submit" 
            disabled={loading || uploading || (!content.trim() && media.length === 0)}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isScheduled ? "Scheduling..." : "Posting..."}
              </>
            ) : uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : isScheduled ? (
              <>
                <Calendar className="h-4 w-4" />
                Schedule
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Post
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}