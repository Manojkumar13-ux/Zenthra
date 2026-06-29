// lib/db/models/Hashtag.ts
import mongoose from "mongoose";

const HashtagSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    count: {
      type: Number,
      default: 0,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    isTrending: {
      type: Boolean,
      default: false,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
HashtagSchema.index({ tag: 1 }, { unique: true });
HashtagSchema.index({ count: -1 });
HashtagSchema.index({ isTrending: 1 });
HashtagSchema.index({ lastUsed: -1 });
HashtagSchema.index({ isTrending: 1, count: -1 });

export const Hashtag = mongoose.models.Hashtag || mongoose.model("Hashtag", HashtagSchema);
