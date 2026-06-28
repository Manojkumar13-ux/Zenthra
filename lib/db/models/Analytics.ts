import mongoose, { Schema, Document } from "mongoose";

export interface IAnalytics extends Document {
  user: mongoose.Types.ObjectId;
  date: Date;
  metrics: {
    followers: number;
    following: number;
    posts: number;
    likes: number;
    comments: number;
    reposts: number;
    bookmarks: number;
    impressions: number;
    reach: number;
    engagementRate: number;
  };
  growth: {
    followersGrowth: number;
    likesGrowth: number;
    commentsGrowth: number;
  };
  topPosts: Array<{
    postId: mongoose.Types.ObjectId;
    content: string;
    likes: number;
    comments: number;
    reposts: number;
    engagement: number;
  }>;
  dailyStats: {
    date: Date;
    posts: number;
    likes: number;
    comments: number;
    impressions: number;
    reach: number;
  }[];
  weeklySummary: {
    weekStart: Date;
    weekEnd: Date;
    posts: number;
    likes: number;
    comments: number;
    impressions: number;
    reach: number;
    averageEngagement: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true 
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    metrics: {
      followers: { type: Number, default: 0 },
      following: { type: Number, default: 0 },
      posts: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      reposts: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      engagementRate: { type: Number, default: 0 },
    },
    growth: {
      followersGrowth: { type: Number, default: 0 },
      likesGrowth: { type: Number, default: 0 },
      commentsGrowth: { type: Number, default: 0 },
    },
    topPosts: [{
      postId: { type: Schema.Types.ObjectId, ref: "Post" },
      content: { type: String },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      reposts: { type: Number, default: 0 },
      engagement: { type: Number, default: 0 },
    }],
    dailyStats: [{
      date: { type: Date, required: true },
      posts: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
    }],
    weeklySummary: [{
      weekStart: { type: Date, required: true },
      weekEnd: { type: Date, required: true },
      posts: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
      averageEngagement: { type: Number, default: 0 },
    }],
  },
  { 
    timestamps: true 
  }
);

// Indexes
AnalyticsSchema.index({ user: 1, date: -1 });
AnalyticsSchema.index({ "metrics.followers": -1 });

export const Analytics = mongoose.models.Analytics || 
  mongoose.model<IAnalytics>("Analytics", AnalyticsSchema);