import mongoose, { Schema, Document } from "mongoose";

export interface IScheduledPost extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId; // Add this field
  media: string[];
  community?: mongoose.Types.ObjectId;
  scheduledAt: Date;
  isScheduled: boolean;
  isPublished: boolean;
  audience: string;
  mood: string;
  location: string;
  hashtags: string[];
  mentions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ScheduledPostSchema = new Schema<IScheduledPost>(
  {
    content: {
      type: String,
      required: true,
      maxlength: 280,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    media: {
      type: [String],
      default: [],
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    isScheduled: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    audience: {
      type: String,
      enum: ["everyone", "followers", "mentioned"],
      default: "everyone",
    },
    mood: {
      type: String,
      enum: ["neutral", "happy", "excited", "sad", "angry", "thoughtful", "funny", "inspirational"],
      default: "neutral",
    },
    location: {
      type: String,
      default: "",
    },
    hashtags: {
      type: [String],
      default: [],
    },
    mentions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const ScheduledPost =
  mongoose.models.ScheduledPost ||
  mongoose.model<IScheduledPost>("ScheduledPost", ScheduledPostSchema);