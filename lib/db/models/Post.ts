// lib/db/models/Post.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPost extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  media: string[];
  community?: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  reposts: mongoose.Types.ObjectId[];
  bookmarks: mongoose.Types.ObjectId[];
  hashtags: string[];
  mentions: string[];
  audience: "everyone" | "followers" | "mentioned";
  mood: "neutral" | "happy" | "excited" | "sad" | "angry" | "thoughtful" | "funny" | "inspirational";
  location?: string;
  isAnonymous: boolean;
  isScheduled: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  editHistory: Array<{
    content: string;
    editedAt: Date;
  }>;
  editedAt?: Date;
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
}

const PostSchema = new Schema<IPost>(
  {
    content: {
      type: String,
      required: [true, "Content is required"],
      maxlength: [280, "Content cannot exceed 280 characters"],
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    media: {
      type: [String],
      default: [],
      validate: {
        validator: function(v: string[]) {
          return v.length <= 10;
        },
        message: "Maximum 10 media files allowed",
      },
    },
    community: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: [],
      },
    ],
    reposts: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    hashtags: {
      type: [String],
      default: [],
    },
    mentions: {
      type: [String],
      default: [],
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
      trim: true,
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    editHistory: [
      {
        content: {
          type: String,
          required: true,
        },
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    editedAt: {
      type: Date,
    },
    scheduledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ============================================
// INDEXES - All indexes defined ONCE here
// ============================================

// Compound indexes for common queries
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ community: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });

// Single field indexes
PostSchema.index({ hashtags: 1 });
PostSchema.index({ isDeleted: 1 });
PostSchema.index({ scheduledAt: 1 });
PostSchema.index({ isScheduled: 1 });

// Text index for search
PostSchema.index(
  { content: "text", hashtags: "text" },
  {
    weights: {
      content: 10,
      hashtags: 5,
    },
    name: "PostTextIndex",
  }
);

// Compound index for trending queries
PostSchema.index({ likesCount: -1, commentsCount: -1, createdAt: -1 });

// ============================================
// VIRTUALS
// ============================================

PostSchema.virtual("likesCount").get(function(this: IPost) {
  return this.likes?.length || 0;
});

PostSchema.virtual("commentsCount").get(function(this: IPost) {
  return this.comments?.length || 0;
});

PostSchema.virtual("repostsCount").get(function(this: IPost) {
  return this.reposts?.length || 0;
});

PostSchema.virtual("bookmarksCount").get(function(this: IPost) {
  return this.bookmarks?.length || 0;
});

PostSchema.virtual("engagementScore").get(function(this: IPost) {
  return (this.likes?.length || 0) * 1 + (this.comments?.length || 0) * 2 + (this.reposts?.length || 0) * 3;
});

// ============================================
// METHODS
// ============================================

PostSchema.methods.isLikedByUser = function(userId: string): boolean {
  return this.likes?.some((id: any) => id.toString() === userId) || false;
};

PostSchema.methods.isBookmarkedByUser = function(userId: string): boolean {
  return this.bookmarks?.some((id: any) => id.toString() === userId) || false;
};

PostSchema.methods.isRepostedByUser = function(userId: string): boolean {
  return this.reposts?.some((id: any) => id.toString() === userId) || false;
};

PostSchema.methods.canView = function(userId?: string): boolean {
  if (this.isDeleted) return false;
  if (this.audience === "everyone") return true;
  if (this.audience === "followers" && userId) {
    return this.author.toString() === userId || false;
  }
  if (this.audience === "mentioned" && userId) {
    return this.mentions?.some((mention: string) => 
      mention.toLowerCase() === userId.toString().toLowerCase()
    ) || this.author.toString() === userId || false;
  }
  return false;
};

// ============================================
// STATIC METHODS
// ============================================

PostSchema.statics.getTrendingHashtags = async function(limit: number = 10) {
  const result = await this.aggregate([
    { $match: { isDeleted: { $ne: true } } },
    { $unwind: "$hashtags" },
    { $group: { _id: "$hashtags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return result;
};

PostSchema.statics.getTrendingPosts = async function(limit: number = 10) {
  return this.find({ 
    isDeleted: { $ne: true },
    hashtags: { $exists: true, $ne: [] }
  })
    .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
    .limit(limit)
    .populate("author", "name username image verified");
};

PostSchema.statics.getFeedPosts = async function(userId: string, followingIds: string[], limit: number = 20) {
  return this.find({
    isDeleted: { $ne: true },
    $or: [
      { author: { $in: followingIds } },
      { author: userId }
    ]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("author", "name username image verified");
};

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

PostSchema.pre("save", function(next) {
  // Extract hashtags from content if not explicitly set
  if (this.content && (!this.hashtags || this.hashtags.length === 0)) {
    const extractedHashtags = this.content.match(/#[\w]+/g) || [];
    this.hashtags = extractedHashtags.map((tag: string) => tag.substring(1).toLowerCase());
  }

  // Extract mentions from content if not explicitly set
  if (this.content && (!this.mentions || this.mentions.length === 0)) {
    const extractedMentions = this.content.match(/@[\w]+/g) || [];
    this.mentions = extractedMentions.map((mention: string) => mention.substring(1).toLowerCase());
  }

  // Remove duplicate hashtags and mentions
  this.hashtags = [...new Set(this.hashtags)];
  this.mentions = [...new Set(this.mentions)];

  // Update editedAt when content changes
  if (this.isModified("content")) {
    this.editHistory.push({
      content: this.content,
      editedAt: new Date(),
    });
    this.editedAt = new Date();
  }

  next();
});

PostSchema.pre(/^find/, function() {
  // @ts-ignore - This is a mongoose query
  this.where({ isDeleted: { $ne: true } });
});

// ============================================
// EXPORT
// ============================================

let Post: Model<IPost>;
try {
  Post = mongoose.model<IPost>("Post");
} catch {
  Post = mongoose.model<IPost>("Post", PostSchema);
}

export { Post };