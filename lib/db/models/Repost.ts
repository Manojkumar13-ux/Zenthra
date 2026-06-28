// lib/db/models/Repost.ts
import mongoose from "mongoose";

export interface IRepost extends mongoose.Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RepostSchema = new mongoose.Schema<IRepost>(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only repost a post once
RepostSchema.index({ post: 1, user: 1 }, { unique: true });

// Index for faster queries
RepostSchema.index({ post: 1 });
RepostSchema.index({ user: 1 });

export const Repost = mongoose.models.Repost || mongoose.model<IRepost>("Repost", RepostSchema);