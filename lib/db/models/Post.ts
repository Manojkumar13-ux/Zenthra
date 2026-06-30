// lib/db/models/Post.ts
import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      default: null,
    },
    video: {
      type: String,
      default: null,
    },
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      username: { type: String, required: true },
      image: { type: String, default: null },
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    isLiked: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: ["everyone", "followers", "only-me"],
      default: "everyone",
    },
    hashtags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: "General",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PostSchema.index({ "author.id": 1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ category: 1 });
PostSchema.index({ hashtags: 1 });

export const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);