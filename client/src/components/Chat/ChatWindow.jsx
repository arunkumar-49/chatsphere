import { useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import Avatar from '../UI/Avatar';
import AddMemberModal from './AddMemberModal';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
import useSocket from '../../hooks/useSocket';

const SERVER_URL = 'http://localhost:5000';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
};

const isSameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

export default function ChatWindow() {
  const {
    activeChannel,
    messages,
    typingUsers,
    isLoadingMessages,
    hasMoreMessages,
    fetchMessages,
    messagePage,
  } = useChatStore();
  const { user } = useAuthStore();
  const { imagePreview, clearImagePreview } = useUIStore();
  const { joinChannel, markRead } = useSocket();
  const messagesEndRef = useRef(null);
  const scrollRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);

  const channelId = activeChannel?._id;
  const channelMessages = messages[channelId] || [];
  const channelTyping = typingUsers[channelId] || {};
  const typingList = Object.values(channelTyping).filter((u) => u);

  // Join channel room when switching
  useEffect(() => {
    if (!channelId) return;
    joinChannel(channelId);
    markRead(channelId);
  }, [channelId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages.length]);

  // Detect scroll position
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setAutoScroll(isAtBottom);

    // Load more on scroll to top
    if (el.scrollTop < 50 && hasMoreMessages[channelId] && !isLoadingMessages) {
      const currentPage = messagePage[channelId] || 1;
      fetchMessages(channelId, currentPage + 1);
    }
  };

  if (!activeChannel) {
    return (
      <div className="chat-area">
        <div className="empty-state">
          <div className="empty-state-icon">💬</div>
          <h3>Welcome to ChatSphere</h3>
          <p>Select a channel or DM from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  const getChannelName = () => {
    if (activeChannel.isGroup) return `# ${activeChannel.name}`;
    const partner = activeChannel.members?.find((m) => m._id !== user?._id);
    return partner?.username || 'Chat';
  };

  const getChannelSub = () => {
    if (activeChannel.isGroup) {
      return `${activeChannel.members?.length || 0} members`;
    }
    const partner = activeChannel.members?.find((m) => m._id !== user?._id);
    return partner?.status === 'online' ? '🟢 Online' : `⚫ Last seen ${partner?.lastSeen ? new Date(partner.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}`;
  };

  const getHeaderAvatar = () => {
    if (activeChannel.isGroup) return null;
    return activeChannel.members?.find((m) => m._id !== user?._id);
  };

  return (
    <div className="chat-area">
      {/* Chat Header */}
      <div className="chat-header">
        {activeChannel.isGroup ? (
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: '1rem', flexShrink: 0 }}>
            #
          </div>
        ) : (
          <Avatar user={getHeaderAvatar()} showStatus />
        )}
        <div className="chat-header-info">
          <div className="chat-header-name">{getChannelName()}</div>
          <div className="chat-header-sub">{getChannelSub()}</div>
        </div>
        <div className="chat-header-actions">
          <button className="icon-btn" title="Members" style={{ gap: 4 }}>
            👥 {activeChannel.members?.length || 0}
          </button>
          {activeChannel.isGroup && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowAddMember(true)}
              title="Add member to channel"
            >
              ➕ Add Member
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container" ref={scrollRef} onScroll={handleScroll}>
        {isLoadingMessages && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
            <span className="spinner" />
          </div>
        )}

        {channelMessages.length === 0 && !isLoadingMessages && (
          <div className="empty-state" style={{ flex: 'none', marginTop: 'auto', paddingTop: 80 }}>
            <div className="empty-state-icon">👋</div>
            <h3>Start the conversation!</h3>
            <p>Be the first to say something in {activeChannel.isGroup ? `#${activeChannel.name}` : 'this chat'}</p>
          </div>
        )}

        {channelMessages.map((msg, idx) => {
          const prev = channelMessages[idx - 1];
          const showDay = !prev || !isSameDay(prev.createdAt, msg.createdAt);
          const showMeta =
            !prev ||
            prev.sender?._id !== msg.sender?._id ||
            showDay ||
            new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000;

          return (
            <div key={msg._id} style={{ position: 'relative' }}>
              {showDay && (
                <div className="day-separator">{formatDate(msg.createdAt)}</div>
              )}
              <MessageBubble
                message={msg}
                showAvatar={showMeta}
                showMeta={showMeta}
                channelId={channelId}
              />
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <div className="typing-indicator">
        {typingList.length > 0 && (
          <>
            <div className="typing-dots">
              <span /><span /><span />
            </div>
            <span>
              {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
            </span>
          </>
        )}
      </div>

      {/* Message Input */}
      <MessageInput channelId={channelId} />

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className="modal-overlay"
          onClick={clearImagePreview}
          style={{ zIndex: 9999 }}
        >
          <img
            src={imagePreview}
            alt="Preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && activeChannel?.isGroup && (
        <AddMemberModal
          channel={activeChannel}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </div>
  );
}
