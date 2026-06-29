"use client";

import { motion } from "framer-motion";

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 p-2">
      <motion.span
        className="h-2 w-2 rounded-full bg-gray-400"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-gray-400"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
      />
      <motion.span
        className="h-2 w-2 rounded-full bg-gray-400"
        animate={{ y: [0, -6, 0] }}
        transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
      />
      <span className="ml-1 text-sm text-gray-500">typing...</span>
    </div>
  );
}
