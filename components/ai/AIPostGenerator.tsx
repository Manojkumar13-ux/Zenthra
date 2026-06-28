"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, Loader2, X, Check } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

interface AIPostGeneratorProps {
  setContent: (content: string) => void;
}

type Tone = "professional" | "casual" | "funny" | "inspirational" | "formal" | "friendly";
type Length = "short" | "medium" | "long";

const TONES: { value: Tone; label: string; emoji: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "casual", label: "Casual", emoji: "😊" },
  { value: "funny", label: "Funny", emoji: "😂" },
  { value: "inspirational", label: "Inspirational", emoji: "💫" },
  { value: "formal", label: "Formal", emoji: "📝" },
  { value: "friendly", label: "Friendly", emoji: "🤝" },
];

const LENGTHS: { value: Length; label: string }[] = [
  { value: "short", label: "Short (1-2 sentences)" },
  { value: "medium", label: "Medium (3-4 sentences)" },
  { value: "long", label: "Long (5-6 sentences)" },
];

const TOPICS = [
  "Technology",
  "Business",
  "Health",
  "Fitness",
  "Travel",
  "Food",
  "Fashion",
  "Art",
  "Music",
  "Science",
  "Education",
  "Motivation",
  "Success",
  "Happiness",
  "Life",
  "Love",
  "Friendship",
  "Family",
  "Career",
  "Finance",
  "Sports",
  "Gaming",
  "Photography",
  "Nature",
  "Culture",
];

export function AIPostGenerator({ setContent }: AIPostGeneratorProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState<Tone>("casual");
  const [length, setLength] = useState<Length>("medium");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedPosts, setGeneratedPosts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const generatePost = async () => {
    if (!session) {
      toast.error("Please login to use AI features");
      return;
    }

    if (!topic && !customPrompt) {
      toast.error("Please enter a topic or custom prompt");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/generate-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          topic: topic || customPrompt,
          tone,
          length,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate post");
      }

      const data = await res.json();
      setGeneratedPosts(data.posts || [data.post]);
      setSelectedPost(null);
      toast.success("Posts generated successfully!");
    } catch (error) {
      console.error("Error generating post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate post");
    } finally {
      setLoading(false);
    }
  };

  const applyPost = (post: string) => {
    setContent(post);
    setIsOpen(false);
    setGeneratedPosts([]);
    setSelectedPost(null);
    toast.success("Post applied!");
  };

  const clearGenerated = () => {
    setGeneratedPosts([]);
    setSelectedPost(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Sparkles className="h-4 w-4 mr-1" />
          AI Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Post Generator
          </DialogTitle>
          <DialogDescription>
            Generate engaging posts with AI. Choose a topic, tone, and length.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Topic */}
          <div className="space-y-2">
            <Label>Topic or Custom Prompt</Label>
            <div className="flex gap-2">
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a topic..." />
                </SelectTrigger>
                <SelectContent>
                  {TOPICS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground self-center">or</span>
            </div>
            <Textarea
              placeholder="Or write your own custom prompt..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[60px]"
            />
          </div>

          {/* Tone */}
          <div className="space-y-2">
            <Label>Tone</Label>
            <div className="grid grid-cols-3 gap-2">
              {TONES.map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  variant={tone === t.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTone(t.value)}
                  className="justify-start"
                >
                  <span className="mr-1">{t.emoji}</span>
                  {t.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Length */}
          <div className="space-y-2">
            <Label>Length</Label>
            <div className="grid grid-cols-3 gap-2">
              {LENGTHS.map((l) => (
                <Button
                  key={l.value}
                  type="button"
                  variant={length === l.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLength(l.value)}
                >
                  {l.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            type="button"
            onClick={generatePost}
            disabled={loading || (!topic && !customPrompt)}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Posts
              </>
            )}
          </Button>

          {/* Generated Posts */}
          {generatedPosts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  Generated Posts ({generatedPosts.length})
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearGenerated}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear all
                </Button>
              </div>
              {generatedPosts.map((post, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedPost === post
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm whitespace-pre-wrap flex-1">{post}</p>
                    <Badge variant="outline" className="shrink-0">
                      Option {index + 1}
                    </Badge>
                  </div>
                  {selectedPost === post && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => applyPost(post)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Use This
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}