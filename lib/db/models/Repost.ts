// lib/db/models/Repost.ts
import mongoose from "mongoose";

const RepostSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    originalAuthor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

RepostSchema.index({ user: 1, post: 1 }, { unique: true });
RepostSchema.index({ post: 1 });
RepostSchema.index({ originalAuthor: 1 });

export const Repost = mongoose.models.Repost || mongoose.model("Repost", RepostSchema);