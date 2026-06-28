// lib/db/models/index.ts
import "./User";
import "./Post";
import "./Comment";
import "./Notification";
import "./Message";
import "./Chat";
import "./Hashtag"; // Now this will work

// Export all models for easy access
export { User } from "./User";
export { Post } from "./Post";
export { Comment } from "./Comment";
export { Notification } from "./Notification";
export { Message } from "./Message";
export { Chat } from "./Chat";
export { Hashtag } from "./Hashtag";