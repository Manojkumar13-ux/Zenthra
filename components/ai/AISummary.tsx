"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface SummaryOptions {
  style: "concise" | "detailed" | "bullet" | "key_points" | "executive";
  tone: "neutral" | "professional" | "casual" | "persuasive";
  language: string;
  maxLength: number;
}

export function AISummary() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState<SummaryOptions>({
    style: "concise",
    tone: "neutral",
    language: "english",
    maxLength: 150,
  });

  const summarizeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ...options }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate summary");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setSummary(data.summary);
      toast.success("Summary generated successfully!");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to summarize");
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard!");
  };

  const getStyleLabel = (style: string) => {
    const labels = {
      concise: "Concise",
      detailed: "Detailed",
      bullet: "Bullet Points",
      key_points: "Key Points",
      executive: "Executive",
    };
    return labels[style as keyof typeof labels] || style;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-lg">AI Text Summarizer</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary-text">Text to Summarize</Label>
          <Textarea
            id="summary-text"
            placeholder="Paste your text here (min 10 characters)..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[120px] resize-y"
            disabled={summarizeMutation.isPending}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{text.length} characters</span>
            <span>{text.split(/\s+/).filter(Boolean).length} words</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="summary-style">Style</Label>
            <Select
              value={options.style}
              onValueChange={(value: any) => setOptions({ ...options, style: value })}
            >
              <SelectTrigger id="summary-style">
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="concise">Concise</SelectItem>
                <SelectItem value="detailed">Detailed</SelectItem>
                <SelectItem value="bullet">Bullet Points</SelectItem>
                <SelectItem value="key_points">Key Points</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary-tone">Tone</Label>
            <Select
              value={options.tone}
              onValueChange={(value: any) => setOptions({ ...options, tone: value })}
            >
              <SelectTrigger id="summary-tone">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="persuasive">Persuasive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary-language">Language</Label>
            <Select
              value={options.language}
              onValueChange={(value) => setOptions({ ...options, language: value })}
            >
              <SelectTrigger id="summary-language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="arabic">Arabic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary-length">Max Words: {options.maxLength}</Label>
            <input
              type="range"
              id="summary-length"
              min="50"
              max="500"
              step="10"
              value={options.maxLength}
              onChange={(e) => setOptions({ ...options, maxLength: parseInt(e.target.value) })}
              className="w-full"
              disabled={options.style === "bullet" || options.style === "key_points"}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>50 words</span>
              <span>500 words</span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => summarizeMutation.mutate()}
          disabled={summarizeMutation.isPending || text.length < 10}
          className="w-full"
        >
          {summarizeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Summarizing...
            </>
          ) : (
            "Generate Summary"
          )}
        </Button>

        {summary && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{getStyleLabel(options.style)}</Badge>
                <Badge variant="secondary" className="text-xs">
                  {summary.split(/\s+/).filter(Boolean).length} words
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{summary}</p>
            </div>
          </div>
        )}

        {summarizeMutation.isError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">
              {summarizeMutation.error instanceof Error
                ? summarizeMutation.error.message
                : "Failed to generate summary. Please try again."}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}