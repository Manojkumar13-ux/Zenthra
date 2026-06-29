"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { postSchema } from "@/lib/validations/post.schema";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AIPostGenerator } from "@/components/ai/AIPostGenerator";
import { AIRewrite } from "@/components/ai/AIRewrite";
import { AIHashtags } from "@/components/ai/AIHashtags";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Image, X, MapPin, Calendar, Globe, Users, AtSign } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

// Lazy load calendar only if available
let CalendarComponent: any = null;
try {
  // Dynamic import to avoid build errors if component is missing
  const calendarModule = require("@/components/ui/calendar");
  CalendarComponent = calendarModule.Calendar || calendarModule.default;
} catch (e) {
  console.warn("Calendar component not available – using fallback");
}

type PostFormData = {
  content: string;
};

interface CreatePostProps {
  onPostCreated?: () => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { data: session } = useSession();
  const [media, setMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audience, setAudience] = useState<"everyone" | "followers" | "mentioned">("everyone");
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [isScheduled, setIsScheduled] = useState(false);
  const [location, setLocation] = useState("");
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: { content: "" },
  });

  const content = watch("content");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          setMedia((prev) => [...prev, data.url]);
        }
      }
      toast.success("Images uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: PostFormData) => {
    if (!session) {
      toast.error("Please login to create a post");
      return;
    }

    setLoading(true);
    try {
      const postData = {
        content: data.content.trim(),
        media: media,
        audience: audience,
        location: location || undefined,
        scheduledAt: isScheduled && scheduleDate ? scheduleDate.toISOString() : undefined,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create post");
      }

      toast.success(isScheduled ? "Post scheduled!" : "Post created!");
      reset();
      setMedia([]);
      setLocation("");
      setScheduleDate(undefined);
      setIsScheduled(false);

      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["profile-feed"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error("CreatePost error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Textarea
          placeholder="What's on your mind?"
          {...register("content")}
          className="resize-none border-0 p-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
          rows={2}
          disabled={loading}
        />
        {errors.content && <p className="text-sm text-red-500">{errors.content.message}</p>}

        {/* Media preview */}
        {media.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {media.map((url, index) => (
              <div key={index} className="relative">
                <img src={url} alt="media" className="h-20 w-20 rounded object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-0.5 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Media Upload */}
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
            <Button type="button" variant="outline" size="sm" disabled={uploading}>
              <Image className="mr-1 h-4 w-4" />
              {uploading ? "Uploading..." : "Media"}
            </Button>
          </label>

          {/* Location */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <MapPin className="mr-1 h-4 w-4" />
                {location || "Location"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <input
                type="text"
                placeholder="Enter location..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded border p-2"
              />
            </PopoverContent>
          </Popover>

          {/* Schedule - with fallback if calendar not available */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Calendar className="mr-1 h-4 w-4" />
                {scheduleDate ? format(scheduleDate, "MMM d, h:mm a") : "Schedule"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              {CalendarComponent ? (
                <>
                  <CalendarComponent
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    initialFocus
                  />
                  {scheduleDate && (
                    <div className="border-t p-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          setIsScheduled(true);
                          toast.success("Post scheduled!");
                        }}
                        className="w-full"
                      >
                        Schedule for {format(scheduleDate, "MMM d, h:mm a")}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  <p>Calendar component not available.</p>
                  <p className="mt-1 text-xs">
                    Please install with: npx shadcn@latest add calendar
                  </p>
                </div>
              )}
            </PopoverContent>
          </Popover>

          {/* Audience */}
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                {audience === "everyone" && <Globe className="mr-1 h-4 w-4" />}
                {audience === "followers" && <Users className="mr-1 h-4 w-4" />}
                {audience === "mentioned" && <AtSign className="mr-1 h-4 w-4" />}
                {audience.charAt(0).toUpperCase() + audience.slice(1)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setAudience("everyone")}
                  className={`w-full rounded px-2 py-1 text-left hover:bg-gray-100 ${audience === "everyone" ? "bg-indigo-50 text-indigo-600" : ""}`}
                >
                  <Globe className="mr-2 inline h-4 w-4" />
                  Everyone
                </button>
                <button
                  type="button"
                  onClick={() => setAudience("followers")}
                  className={`w-full rounded px-2 py-1 text-left hover:bg-gray-100 ${audience === "followers" ? "bg-indigo-50 text-indigo-600" : ""}`}
                >
                  <Users className="mr-2 inline h-4 w-4" />
                  Followers Only
                </button>
                <button
                  type="button"
                  onClick={() => setAudience("mentioned")}
                  className={`w-full rounded px-2 py-1 text-left hover:bg-gray-100 ${audience === "mentioned" ? "bg-indigo-50 text-indigo-600" : ""}`}
                >
                  <AtSign className="mr-2 inline h-4 w-4" />
                  Mentioned Users
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <AIPostGenerator setContent={(text: string) => setValue("content", text)} />
          <AIRewrite content={content} setContent={(text: string) => setValue("content", text)} />
          <AIHashtags content={content} setContent={(text: string) => setValue("content", text)} />

          <Button type="submit" disabled={loading || !content.trim()} className="ml-auto">
            {loading ? "Posting..." : isScheduled ? "Schedule" : "Post"}
          </Button>
        </div>
      </form>
    </div>
  );
}
