import mongoose, { Schema, Document } from "mongoose";

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  name?: string;
  isGroup: boolean;
  avatar?: string;
  lastMessage?: mongoose.Types.ObjectId;
  admins?: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    name: { type: String, maxlength: 50 },
    isGroup: { type: Boolean, default: false },
    avatar: { type: String },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    admins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ChatSchema.index({ participants: 1 });
ChatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.models.Chat || mongoose.model<IChat>("Chat", ChatSchema);
