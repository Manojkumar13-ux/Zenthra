import mongoose, { Schema, Document } from "mongoose";

export interface ITrendingHashtag extends Document {
  tag: string;
  count: number;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrendingHashtagSchema = new Schema<ITrendingHashtag>(
  {
    tag: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
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

// Index for sorting trending
TrendingHashtagSchema.index({ count: -1, lastUsed: -1 });

export const TrendingHashtag =
  mongoose.models.TrendingHashtag ||
  mongoose.model<ITrendingHashtag>("TrendingHashtag", TrendingHashtagSchema);
