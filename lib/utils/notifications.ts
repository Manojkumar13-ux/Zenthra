import { connectDB } from "@/lib/db/connect";
import { Notification } from "@/lib/db/models/Notification";

type NotificationType = "like" | "comment" | "mention" | "follow" | "message" | "repost" | "community";

interface CreateNotificationParams {
  userId: string;
  fromUserId: string;
  type: NotificationType;
  message: string;
  postId?: string;
  communityId?: string;
}

export async function createNotification({
  userId,
  fromUserId,
  type,
  message,
  postId,
  communityId,
}: CreateNotificationParams) {
  // Don't notify if it's the same user
  if (userId === fromUserId) return;

  await connectDB();

  const notification = new Notification({
    user: userId,
    from: fromUserId,
    type,
    message,
    post: postId,
    community: communityId,
    read: false,
  });

  await notification.save();
}