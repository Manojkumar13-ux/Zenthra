// lib/db/models/User.ts
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: false,
    },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
    },
    image: {
      type: String,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio cannot exceed 160 characters"],
    },
    location: {
      type: String,
      default: "",
    },
    website: {
      type: String,
      default: "",
    },
    twitter: {
      type: String,
      default: "",
    },
    instagram: {
      type: String,
      default: "",
    },
    github: {
      type: String,
      default: "",
    },
    youtube: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    googleId: {
      type: String,
      sparse: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    postsCount: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
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

// Unique indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });

// Performance indexes
UserSchema.index({ createdAt: -1 });
UserSchema.index({ name: 1, createdAt: -1 });
UserSchema.index({ isActive: 1, lastActive: -1 });

// Text index for search
UserSchema.index(
  { name: "text", username: "text", email: "text" },
  {
    weights: {
      name: 10,
      username: 8,
      email: 5,
    },
    name: "UserTextIndex",
  }
);

// ============================================
// VIRTUALS
// ============================================

UserSchema.virtual("followersCount").get(function() {
  return this.followers?.length || 0;
});

UserSchema.virtual("followingCount").get(function() {
  return this.following?.length || 0;
});

// ============================================
// METHODS
// ============================================

UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

UserSchema.methods.isFollowing = function(userId: string): boolean {
  return this.following?.some((id: any) => id.toString() === userId) || false;
};

UserSchema.methods.isFollowedBy = function(userId: string): boolean {
  return this.followers?.some((id: any) => id.toString() === userId) || false;
};

// ============================================
// STATIC METHODS
// ============================================

UserSchema.statics.search = async function(query: string, limit: number = 10) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .select("-password");
};

UserSchema.statics.getSuggested = async function(userId: string, limit: number = 10) {
  const user = await this.findById(userId);
  const following = user?.following?.map((id: any) => id.toString()) || [];
  
  return this.find({
    _id: { $ne: userId, $nin: following },
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("-password");
};

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

UserSchema.pre("save", function(next) {
  this.updatedAt = new Date();
  
  if (this.username) {
    this.username = this.username.toLowerCase().trim();
  }
  
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  
  next();
});

UserSchema.pre(/^find/, function() {
  // @ts-ignore - This is a mongoose query
  this.where({ isActive: { $ne: false } });
});

// ============================================
// EXPORT
// ============================================

export const User = mongoose.models.User || mongoose.model("User", UserSchema);