"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function MessageBubble({ message, isOwn }: { message: any; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-xs px-4 py-2 rounded-xl",
          isOwn ? "bg-indigo-600 text-white" : "bg-gray-200 dark:bg-gray-700"
        )}
      >
        <p>{message.content}</p>
        <p className="text-xs opacity-70 mt-1">{format(new Date(message.createdAt), "p")}</p>
      </div>
    </div>
  );
}