"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Sparkles, Loader2, RefreshCw, Check, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface AIRewriteProps {
  content: string;
  setContent: (content: string) => void;
}

type RewriteStyle = "professional" | "casual" | "formal" | "friendly" | "concise" | "detailed";

const REWRITE_STYLES: { value: RewriteStyle; label: string; emoji: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼" },
  { value: "casual", label: "Casual", emoji: "😊" },
  { value: "formal", label: "Formal", emoji: "📝" },
  { value: "friendly", label: "Friendly", emoji: "🤝" },
  { value: "concise", label: "Concise", emoji: "✂️" },
  { value: "detailed", label: "Detailed", emoji: "📚" },
];

export function AIRewrite({ content, setContent }: AIRewriteProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState<RewriteStyle>("casual");
  const [rewrittenContent, setRewrittenContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<string[]>([]);

  const handleRewrite = async () => {
    if (!session) {
      toast.error("Please login to use AI features");
      return;
    }

    if (!content.trim()) {
      toast.error("Please write some content to rewrite");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content,
          style,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to rewrite content");
      }

      const data = await res.json();
      setVariations(data.variations || [data.rewritten]);
      setRewrittenContent(data.rewritten || data.variations?.[0] || "");
      toast.success("Content rewritten!");
    } catch (error) {
      console.error("Error rewriting:", error);
      toast.error(error instanceof Error ? error.message : "Failed to rewrite content");
    } finally {
      setLoading(false);
    }
  };

  const applyRewrite = (text: string) => {
    setContent(text);
    setIsOpen(false);
    setVariations([]);
    setRewrittenContent("");
    toast.success("Rewrite applied!");
  };

  const clearVariations = () => {
    setVariations([]);
    setRewrittenContent("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={!content.trim()}>
          <RefreshCw className="mr-1 h-4 w-4" />
          AI Rewrite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            AI Rewrite
          </DialogTitle>
          <DialogDescription>Rewrite your content in a different style or tone.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original Content */}
          <div className="space-y-2">
            <Label>Original Content</Label>
            <div className="rounded-lg bg-muted p-3">
              <p className="whitespace-pre-wrap text-sm">{content || "Write something first..."}</p>
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label>Rewrite Style</Label>
            <div className="grid grid-cols-3 gap-2">
              {REWRITE_STYLES.map((s) => (
                <Button
                  key={s.value}
                  type="button"
                  variant={style === s.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStyle(s.value)}
                  className="justify-start"
                >
                  <span className="mr-1">{s.emoji}</span>
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Rewrite Button */}
          <Button
            type="button"
            onClick={handleRewrite}
            disabled={loading || !content.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Rewrite
              </>
            )}
          </Button>

          {/* Variations */}
          {variations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Variations ({variations.length})</Label>
                <Button type="button" variant="ghost" size="sm" onClick={clearVariations}>
                  <X className="mr-1 h-4 w-4" />
                  Clear all
                </Button>
              </div>
              {variations.map((text, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 whitespace-pre-wrap text-sm">{text}</p>
                    <Badge variant="outline" className="shrink-0">
                      V{index + 1}
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button type="button" size="sm" onClick={() => applyRewrite(text)}>
                      <Check className="mr-1 h-4 w-4" />
                      Use This
                    </Button>
                  </div>
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
