import { create } from "zustand";

interface Message {
  _id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  chatId: string;
  read: boolean;
  readBy: string[];
  createdAt: string;
  status?: "sending" | "sent" | "delivered" | "read";
}

interface ChatState {
  messages: Record<string, Message[]>;
  typingUsers: Record<string, boolean>;
  unreadCounts: Record<string, number>;
  activeChat: string | null;
  setActiveChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  setTypingStatus: (userId: string, isTyping: boolean) => void;
  setReadReceipt: (messageId: string, userId: string) => void;
  markChatAsRead: (chatId: string) => void;
  incrementUnread: (chatId: string) => void;
  clearChat: (chatId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: {},
  typingUsers: {},
  unreadCounts: {},
  activeChat: null,

  setActiveChat: (chatId) => {
    set({ activeChat: chatId });
    if (chatId) {
      get().markChatAsRead(chatId);
    }
  },

  addMessage: (chatId, message) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    }));

    // Increment unread count if not in active chat
    const currentState = get();
    if (currentState.activeChat !== chatId) {
      currentState.incrementUnread(chatId);
    }
  },

  setTypingStatus: (userId, isTyping) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: isTyping,
      },
    }));

    // Auto-clear typing after 3 seconds
    if (isTyping) {
      setTimeout(() => {
        set((state) => ({
          typingUsers: {
            ...state.typingUsers,
            [userId]: false,
          },
        }));
      }, 3000);
    }
  },

  setReadReceipt: (messageId, userId) => {
    set((state) => {
      const newMessages = { ...state.messages };
      Object.keys(newMessages).forEach((chatId) => {
        newMessages[chatId] = newMessages[chatId].map((msg) => {
          if (msg._id === messageId) {
            return {
              ...msg,
              read: true,
              readBy: [...(msg.readBy || []), userId],
            };
          }
          return msg;
        });
      });
      return { messages: newMessages };
    });
  },

  markChatAsRead: (chatId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: 0,
      },
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((msg) => ({
          ...msg,
          read: true,
        })),
      },
    }));
  },

  incrementUnread: (chatId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: (state.unreadCounts[chatId] || 0) + 1,
      },
    }));
  },

  clearChat: (chatId) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [],
      },
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: 0,
      },
    }));
  },
}));
