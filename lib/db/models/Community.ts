import mongoose, { Schema, Document } from "mongoose";

export interface ICommunity extends Document {
  name: string;
  description: string;
  image?: string;
  isPrivate: boolean;
  owner: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  moderators: mongoose.Types.ObjectId[];
  posts: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  memberCount: number;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: {
      type: String,
      required: [true, "Community name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    moderators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    posts: [
      {
        type: Schema.Types.ObjectId,
        ref: "Post",
        default: [],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
CommunitySchema.index({ name: "text" });
CommunitySchema.index({ members: 1 });
CommunitySchema.index({ owner: 1 });

// Virtual for member count
CommunitySchema.virtual("memberCount").get(function (this: ICommunity) {
  return this.members?.length || 0;
});

// Ensure virtuals are included in JSON output
CommunitySchema.set("toJSON", { virtuals: true });
CommunitySchema.set("toObject", { virtuals: true });

export const Community =
  mongoose.models.Community || mongoose.model<ICommunity>("Community", CommunitySchema);
