import { create } from "zustand";

interface Notification {
  id: string;
  type: "message" | "like" | "comment" | "follow" | "mention" | "repost";
  message: string;
  read: boolean;
  createdAt: Date;
  data?: any;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setUnreadCount: (count) => {
    set({ unreadCount: count });
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      createdAt: new Date(),
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));

    // Show browser notification if permitted
    if (typeof window !== "undefined" && Notification.permission === "granted") {
      new Notification("Zenthra", {
        body: notification.message,
        icon: "/favicon.ico",
      });
    }
  },

  markAsRead: (id) => {
    set((state) => {
      const updatedNotifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.read).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
}));
