"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-xs rounded-xl px-4 py-2",
          isOwn ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-gray-700"
        )}
      >
        <p>{message.content}</p>
        <p className="mt-1 text-xs opacity-70">{format(new Date(message.createdAt), "p")}</p>
      </div>
    </div>
  );
}
