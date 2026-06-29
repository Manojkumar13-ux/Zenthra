// lib/utils/hashtags.ts
export function extractHashtags(content: string): string[] {
  const matches = content.match(/#[\w\u0590-\u05fe]+/g) || [];
  return matches.map((tag) => tag.slice(1).toLowerCase());
}

export function countHashtagUsage(content: string): Record<string, number> {
  const hashtags = extractHashtags(content);
  const counts: Record<string, number> = {};

  for (const tag of hashtags) {
    counts[tag] = (counts[tag] || 0) + 1;
  }

  return counts;
}
