import mongoose, { Schema, Document } from "mongoose";

export interface IReport extends Document {
  reportedBy: mongoose.Types.ObjectId;
  targetType: "post" | "comment" | "user";
  targetId: mongoose.Types.ObjectId;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["post", "comment", "user"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["pending", "resolved", "dismissed"], default: "pending" },
  },
  {
    timestamps: true,
  }
);

export const Report =
  mongoose.models.Report ||
  mongoose.model<IReport>("Report", ReportSchema);