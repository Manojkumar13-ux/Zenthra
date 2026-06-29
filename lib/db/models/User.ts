// lib/db/models/User.ts
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: function(this: any) {
        return !this.googleId && !this.githubId;
      },
      minlength: [6, "Password must be at least 6 characters"],
    },
    image: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [160, "Bio cannot exceed 160 characters"],
      default: "",
    },
    location: {
      type: String,
      default: "",
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    website: {
      type: String,
      default: "",
      maxlength: [200, "Website URL cannot exceed 200 characters"],
    },
    birthday: {
      type: Date,
      default: null,
    },
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
    blocked: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
    blockedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
    muted: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: [],
    }],
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    googleId: {
      type: String,
      default: null,
    },
    githubId: {
      type: String,
      default: null,
    },
    twitterId: {
      type: String,
      default: null,
    },
    facebookId: {
      type: String,
      default: null,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    themePreference: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
    },
    stats: {
      postsCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      likesReceived: { type: Number, default: 0 },
      repostsReceived: { type: Number, default: 0 },
      followersCount: { type: Number, default: 0 },
      followingCount: { type: Number, default: 0 },
    },
    online: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    lastLoginIP: {
      type: String,
      default: null,
    },
    lastLoginDevice: {
      type: String,
      default: null,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    socialLinks: {
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      youtube: { type: String, default: "" },
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      tiktok: { type: String, default: "" },
      snapchat: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================
// INDEXES
// ============================================
UserSchema.index({ username: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
UserSchema.index({ githubId: 1 }, { unique: true, sparse: true });
UserSchema.index({ twitterId: 1 }, { unique: true, sparse: true });
UserSchema.index({ facebookId: 1 }, { unique: true, sparse: true });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ "stats.followersCount": -1 });
UserSchema.index({ online: 1, lastActive: -1 });

// ============================================
// VIRTUALS
// ============================================
UserSchema.virtual("followerCount").get(function() {
  return this.followers?.length || 0;
});

UserSchema.virtual("followingCount").get(function() {
  return this.following?.length || 0;
});

// ============================================
// METHODS
// ============================================
UserSchema.methods.isFollowingUser = function(userId: string) {
  return this.following?.some((id: any) => id.toString() === userId) || false;
};

UserSchema.methods.isFollowedByUser = function(userId: string) {
  return this.followers?.some((id: any) => id.toString() === userId) || false;
};

UserSchema.methods.incrementPostCount = async function() {
  this.stats.postsCount = (this.stats.postsCount || 0) + 1;
  await this.save();
};

UserSchema.methods.decrementPostCount = async function() {
  if (this.stats.postsCount > 0) {
    this.stats.postsCount = (this.stats.postsCount || 0) - 1;
    await this.save();
  }
};

UserSchema.methods.updateLastActive = function() {
  this.lastActive = new Date();
  this.online = true;
  return this.save();
};

UserSchema.methods.setOffline = function() {
  this.online = false;
  this.lastSeen = new Date();
  return this.save();
};

// ============================================
// STATICS
// ============================================
UserSchema.statics.findByEmailOrUsername = function(identifier: string) {
  return this.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { username: identifier.toLowerCase() },
    ],
  });
};

UserSchema.statics.findSuggested = function(userId: string, limit = 5) {
  return this.find({
    _id: { $ne: userId },
    isActive: true,
    isSuspended: false,
  })
    .select("name username image bio stats.followersCount")
    .sort({ "stats.followersCount": -1 })
    .limit(limit);
};

UserSchema.statics.searchUsers = function(query: string, limit = 10) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
    ],
    isActive: true,
    isSuspended: false,
  })
    .select("name username image bio")
    .limit(limit);
};

// ============================================
// MIDDLEWARE
// ============================================
UserSchema.pre("save", function(next) {
  // Ensure stats object exists
  if (!this.stats) {
    this.stats = {
      postsCount: 0,
      commentsCount: 0,
      likesReceived: 0,
      repostsReceived: 0,
      followersCount: 0,
      followingCount: 0,
    };
  }
  
  if (this.followers) {
    this.stats.followersCount = this.followers.length;
  }
  if (this.following) {
    this.stats.followingCount = this.following.length;
  }
  next();
});

// Use 'findOneAndDelete' middleware for cleanup
UserSchema.pre("findOneAndDelete", async function(next) {
  try {
    const doc = await this.model.findOne(this.getFilter());
    if (doc) {
      // Remove user from followers/following lists
      await mongoose.model("User").updateMany(
        { $or: [{ following: doc._id }, { followers: doc._id }] },
        { $pull: { following: doc._id, followers: doc._id } }
      );
      
      // Delete user's posts
      await mongoose.model("Post").deleteMany({ author: doc._id });
      
      // Delete user's comments
      await mongoose.model("Comment").deleteMany({ author: doc._id });
      
      // Delete user's notifications
      await mongoose.model("Notification").deleteMany({ recipient: doc._id });
    }
    next();
  } catch (error) {
    next(error as any);
  }
});

// ============================================
// TO JSON / TO OBJECT
// ============================================
UserSchema.set("toJSON", {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.emailVerificationToken;
    // Use delete with type assertion to avoid TypeScript error
    delete (ret as any).__v;
    return ret;
  },
});

UserSchema.set("toObject", {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    delete ret.emailVerificationToken;
    // Use delete with type assertion to avoid TypeScript error
    delete (ret as any).__v;
    return ret;
  },
});

// ============================================
// EXPORT
// ============================================
export const User = mongoose.models.User || mongoose.model("User", UserSchema);