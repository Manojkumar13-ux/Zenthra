import mongoose, { Schema, Document } from "mongoose";

export interface ILike extends Document {
  post: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    post: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

LikeSchema.index({ user: 1, post: 1 }, { unique: true });

export const Like = mongoose.models.Like || mongoose.model<ILike>("Like", LikeSchema);
