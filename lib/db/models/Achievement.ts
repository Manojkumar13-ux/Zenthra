import mongoose, { Schema, Document } from "mongoose";

export interface IAchievement extends Document {
  user: mongoose.Types.ObjectId;
  type: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AchievementSchema = new Schema<IAchievement>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: "🏆" },
    unlockedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const Achievement =
  mongoose.models.Achievement ||
  mongoose.model<IAchievement>("Achievement", AchievementSchema);