import { create } from 'zustand';
import api from '../api/axios';

const useChatStore = create((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: {},
  typingUsers: {},
  onlineUsers: [],
  notifications: [],
  unreadCount: 0,
  isLoadingMessages: false,
  hasMoreMessages: {},
  messagePage: {},

  setChannels: (channels) => set({ channels }),

  addChannel: (channel) => {
    set((state) => {
      const exists = state.channels.find((c) => c._id === channel._id);
      if (exists) return {};
      return { channels: [channel, ...state.channels] };
    });
  },

  updateChannel: (updatedChannel) => {
    set((state) => ({
      channels: state.channels.map((c) => c._id === updatedChannel._id ? updatedChannel : c),
      activeChannel: state.activeChannel?._id === updatedChannel._id ? updatedChannel : state.activeChannel,
    }));
  },

  setActiveChannel: async (channel) => {
    set({ activeChannel: channel, isLoadingMessages: true });
    const { messages } = get();
    if (!messages[channel._id]) await get().fetchMessages(channel._id);
    set({ isLoadingMessages: false });
  },

  fetchChannels: async () => {
    const { data } = await api.get('/channels');
    set({ channels: data.channels });
  },

  fetchMessages: async (channelId, page = 1) => {
    try {
      set({ isLoadingMessages: true });
      const { data } = await api.get(`/messages/${channelId}?page=${page}&limit=50`);
      set((state) => ({
        messages: { ...state.messages, [channelId]: page === 1 ? data.messages : [...data.messages, ...(state.messages[channelId] || [])] },
        hasMoreMessages: { ...state.hasMoreMessages, [channelId]: data.hasMore },
        messagePage: { ...state.messagePage, [channelId]: page },
        isLoadingMessages: false,
      }));
    } catch (err) { set({ isLoadingMessages: false }); }
  },

  addMessage: (message) => {
    const channelId = typeof message.channel === 'string' ? message.channel : message.channel?._id;
    set((state) => {
      const existing = state.messages[channelId] || [];
      if (existing.find((m) => m._id === message._id)) return {};
      return { messages: { ...state.messages, [channelId]: [...existing, message] } };
    });
  },

  updateMessage: (updatedMessage) => {
    const channelId = typeof updatedMessage.channel === 'string' ? updatedMessage.channel : updatedMessage.channel?._id;
    set((state) => ({
      messages: { ...state.messages, [channelId]: (state.messages[channelId] || []).map((m) => m._id === updatedMessage._id ? updatedMessage : m) },
    }));
  },

  removeMessage: (messageId, channelId) => {
    set((state) => ({ messages: { ...state.messages, [channelId]: (state.messages[channelId] || []).filter((m) => m._id !== messageId) } }));
  },

  setTyping: (channelId, userId, username) => {
    set((state) => ({ typingUsers: { ...state.typingUsers, [channelId]: { ...(state.typingUsers[channelId] || {}), [userId]: username } } }));
  },

  clearTyping: (channelId, userId) => {
    set((state) => {
      const ch = { ...(state.typingUsers[channelId] || {}) };
      delete ch[userId];
      return { typingUsers: { ...state.typingUsers, [channelId]: ch } };
    });
  },

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setUserStatus: (userId, status) => {
    set((state) => {
      const onlineUsers = status === 'online'
        ? [...new Set([...state.onlineUsers, userId])]
        : state.onlineUsers.filter((id) => id !== userId);
      return {
        onlineUsers,
        channels: state.channels.map((ch) => ({ ...ch, members: ch.members?.map((m) => m._id === userId ? { ...m, status } : m) })),
      };
    });
  },

  fetchNotifications: async () => {
    const { data } = await api.get('/messages/notifications');
    set({ notifications: data.notifications, unreadCount: data.unreadCount });
  },

  addNotification: (notif) => {
    set((state) => ({ notifications: [notif, ...state.notifications].slice(0, 30), unreadCount: state.unreadCount + 1 }));
  },

  markNotificationsRead: async () => {
    await api.put('/messages/notifications/read');
    set({ unreadCount: 0, notifications: [] });
  },

  updateChannelLastMessage: (channelId, message) => {
    set((state) => ({ channels: state.channels.map((c) => c._id === channelId ? { ...c, lastMessage: message, lastActivity: new Date().toISOString() } : c) }));
  },
}));

export default useChatStore;