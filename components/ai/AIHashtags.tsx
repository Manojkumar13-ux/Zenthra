"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Hash, Loader2, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface AIHashtagsProps {
  content: string;
  setContent: (content: string) => void;
}

interface Hashtag {
  tag: string;
  relevance: number;
}

export function AIHashtags({ content, setContent }: AIHashtagsProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  useEffect(() => {
    // Extract existing hashtags from content
    const existingTags = content.match(/#[\w]+/g) || [];
    setSelectedTags(existingTags.map((tag) => tag.substring(1)));
  }, [content]);

  const generateHashtags = async () => {
    if (!session) {
      toast.error("Please login to use AI features");
      return;
    }

    if (!content.trim()) {
      toast.error("Please write some content first");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate hashtags");
      }

      const data = await res.json();
      setHashtags(data.hashtags || []);
      toast.success("Hashtags generated!");
    } catch (error) {
      console.error("Error generating hashtags:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate hashtags");
    } finally {
      setLoading(false);
    }
  };

  const toggleHashtag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomHashtag = () => {
    if (!customTag.trim()) return;
    const cleanTag = customTag.trim().replace(/^#/, "");
    if (selectedTags.includes(cleanTag)) {
      toast.error("Hashtag already added");
      return;
    }
    setSelectedTags([...selectedTags, cleanTag]);
    setCustomTag("");
  };

  const applyHashtags = () => {
    // Remove existing hashtags from content
    let newContent = content.replace(/#[\w]+/g, "").trim();

    // Add selected hashtags
    const hashtagString = selectedTags.map((tag) => `#${tag}`).join(" ");
    if (hashtagString) {
      newContent = newContent + " " + hashtagString;
    }

    setContent(newContent);
    setIsOpen(false);
    setHashtags([]);
    toast.success("Hashtags applied!");
  };

  const clearHashtags = () => {
    setHashtags([]);
    setSelectedTags([]);
  };

  const removeTag = (tag: string) => {
    setSelectedTags((prev) => prev.filter((t) => t !== tag));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Hash className="mr-1 h-4 w-4" />
          AI Hashtags
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-orange-500" />
            AI Hashtag Generator
          </DialogTitle>
          <DialogDescription>Generate relevant hashtags for your content.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Content Preview */}
          <div className="space-y-2">
            <Label>Content Preview</Label>
            <div className="max-h-[80px] overflow-y-auto rounded-lg bg-muted p-3">
              <p className="whitespace-pre-wrap text-sm">{content || "Write something first..."}</p>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            type="button"
            onClick={generateHashtags}
            disabled={loading || !content.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Hash className="mr-2 h-4 w-4" />
                Generate Hashtags
              </>
            )}
          </Button>

          {/* Generated Hashtags */}
          {hashtags.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Suggested Hashtags</Label>
                <Button type="button" variant="ghost" size="sm" onClick={clearHashtags}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((h) => (
                  <Badge
                    key={h.tag}
                    variant={selectedTags.includes(h.tag) ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1 text-sm transition-opacity hover:opacity-80"
                    onClick={() => toggleHashtag(h.tag)}
                  >
                    #{h.tag}
                    <span className="ml-1 text-xs opacity-60">{h.relevance}%</span>
                    {selectedTags.includes(h.tag) && <Check className="ml-1 h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom Hashtag */}
          <div className="space-y-2">
            <Label>Add Custom Hashtag</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  #
                </span>
                <Input
                  placeholder="customtag"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value.replace(/^#/, ""))}
                  className="pl-6"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomHashtag();
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={addCustomHashtag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Hashtags */}
          {selectedTags.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Selected Hashtags ({selectedTags.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map((tag) => (
                  <Badge key={tag} variant="default" className="px-3 py-1 text-sm">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={applyHashtags} disabled={selectedTags.length === 0}>
            <Check className="mr-1 h-4 w-4" />
            Apply Hashtags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
