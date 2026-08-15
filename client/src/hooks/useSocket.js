import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import useUIStore from '../store/uiStore';

let socket = null;
export const getSocket = () => socket;

const useSocket = () => {
  const { token, isAuthenticated } = useAuthStore();
  const { addMessage, updateMessage, removeMessage, setTyping, clearTyping, setOnlineUsers, setUserStatus, addNotification, updateChannelLastMessage } = useChatStore();
  const { addToast } = useUIStore();
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token || connectedRef.current) return;

    socket = io('http://localhost:5000', { auth: { token }, transports: ['websocket', 'polling'] });
    connectedRef.current = true;

    socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));

    socket.on('new_message', (message) => {
      addMessage(message);
      const channelId = typeof message.channel === 'string' ? message.channel : message.channel?._id;
      updateChannelLastMessage(channelId, message);
    });

    socket.on('user_typing', ({ userId, username, channelId }) => setTyping(channelId, userId, username));
    socket.on('user_stopped_typing', ({ userId, channelId }) => clearTyping(channelId, userId));
    socket.on('message_reaction', (msg) => updateMessage(msg));
    socket.on('message_edited', (msg) => updateMessage(msg));
    socket.on('message_deleted', ({ messageId }) => {
      const { activeChannel } = useChatStore.getState();
      if (activeChannel) removeMessage(messageId, activeChannel._id);
    });
    socket.on('online_users', (userIds) => setOnlineUsers(userIds));
    socket.on('user_status_change', ({ userId, status }) => setUserStatus(userId, status));
    socket.on('new_notification', (notification) => addNotification(notification));
    socket.on('error', ({ message }) => addToast(message, 'error'));
    socket.on('disconnect', () => { connectedRef.current = false; });

    return () => {
      if (socket) { socket.disconnect(); socket = null; connectedRef.current = false; }
    };
  }, [isAuthenticated, token]);

  const joinChannel = (channelId) => socket?.emit('join_channel', channelId);
  const leaveChannel = (channelId) => socket?.emit('leave_channel', channelId);
  const sendMessage = (data) => socket?.emit('send_message', data);
  const startTyping = (channelId) => socket?.emit('typing_start', { channelId });
  const stopTyping = (channelId) => socket?.emit('typing_stop', { channelId });
  const markRead = (channelId) => socket?.emit('mark_read', { channelId });
  const reactMessage = (messageId, emoji) => socket?.emit('react_message', { messageId, emoji });
  const editMessage = (messageId, content) => socket?.emit('edit_message', { messageId, content });
  const deleteMessage = (messageId) => socket?.emit('delete_message', { messageId });

  return { socket, joinChannel, leaveChannel, sendMessage, startTyping, stopTyping, markRead, reactMessage, editMessage, deleteMessage };
};

export default useSocket;
