import { useEffect } from 'react';
import Avatar from '../UI/Avatar';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';

const timeAgo = (dateStr) => {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function NotificationsPanel() {
  const { notifications, unreadCount, fetchNotifications, markNotificationsRead, setActiveChannel, channels } = useChatStore();
  const { closeNotifications } = useUIStore();

  useEffect(() => { fetchNotifications(); }, []);

  const handleNotifClick = (notif) => {
    if (notif.channel) {
      const ch = channels.find((c) => c._id === (notif.channel._id || notif.channel));
      if (ch) setActiveChannel(ch);
    }
    closeNotifications();
  };

  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <span>🔔 Notifications {unreadCount > 0 && `(${unreadCount})`}</span>
        {unreadCount > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markNotificationsRead}>
            Mark all read
          </button>
        )}
      </div>

      <div className="notif-list">
        {notifications.length === 0 && (
          <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            🎉 You&apos;re all caught up!
          </div>
        )}
        {notifications.map((notif) => (
          <div
            key={notif._id}
            className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
            onClick={() => handleNotifClick(notif)}
          >
            <Avatar user={notif.sender} size="sm" showStatus={false} />
            <div className="notif-item-text">
              <strong>{notif.sender?.username}</strong>: {notif.text}
            </div>
            <div className="notif-item-time">{timeAgo(notif.createdAt)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
