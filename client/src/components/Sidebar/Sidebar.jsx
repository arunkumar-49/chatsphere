import Avatar from '../UI/Avatar';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';
export default function Sidebar() {
  const { channels, activeChannel, setActiveChannel } = useChatStore();
  const { user, logout } = useAuthStore();
  const {
    toggleCreateChannel,
    toggleUserSearch,
    toggleTheme,
    toggleProfile,
    openBrowseChannels,
    theme,
  } = useUIStore();
  const groupChannels = channels.filter((c) => c.isGroup);
  const dmChannels = channels.filter((c) => !c.isGroup);
  const getDMPartner = (channel) => {
    return channel.members?.find((m) => m._id !== user?._id);
  };
  const getChannelName = (channel) => {
    if (channel.isGroup) return channel.name;
    const partner = getDMPartner(channel);
    return partner?.username || 'Unknown';
  };
  const getChannelAvatar = (channel) => {
    if (channel.isGroup) return null;
    return getDMPartner(channel);
  };
  const getLastMessagePreview = (channel) => {
    if (!channel.lastMessage) return 'No messages yet';
    const msg = channel.lastMessage;
    if (msg.type === 'image') return '📷 Image';
    if (msg.type === 'file') return `📎 ${msg.fileName || 'File'}`;
    const content = msg.content || '';
    const senderName = msg.sender?.username === user?.username ? 'You' : msg.sender?.username;
    return `${senderName}: ${content.substring(0, 30)}${content.length > 30 ? '...' : ''}`;
  };

  const handleChannelClick = (ch) => {
    setActiveChannel(ch);
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <span className="sidebar-logo">💬 ChatSphere</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
      {/* Search / New DM */}
      <div style={{ padding: '8px 12px' }}>
        <button
          className="btn btn-secondary btn-full"
          style={{ fontSize: '0.8rem', gap: 6 }}
          onClick={toggleUserSearch}
          id="find-people-btn"
        >
          🔍 Find People
        </button>
      </div>


      {/* Scrollable content */}
      <div className="sidebar-scroll">
        {/* Group Channels */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>Channels</span>
            <button onClick={toggleCreateChannel} title="Create channel" id="new-channel-btn">＋</button>
          </div>
          {groupChannels.length === 0 && (
            <p style={{ padding: '4px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              No channels yet
            </p>
          )}
          {groupChannels.map((ch) => (
            <div
              key={ch._id}
              className={`sidebar-item ${activeChannel?._id === ch._id ? 'active' : ''}`}
              onClick={() => handleChannelClick(ch)}
            >
              <span style={{ fontSize: '1rem' }}>
                {ch.isPasswordProtected ? '🔒' : '#'}
              </span>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div className="sidebar-item-name">{ch.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getLastMessagePreview(ch)}
                </div>
              </div>
            </div>
          ))}
          {/* Browse all channels button */}
          <button className="sidebar-browse-btn" onClick={openBrowseChannels}>
            🌐 Browse All Channels
          </button>
        </div>
        {/* Direct Messages */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">
            <span>Direct Messages</span>
          </div>
          {dmChannels.length === 0 && (
            <p style={{ padding: '4px 16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              No DMs yet — search for people above
            </p>
          )}
          {dmChannels.map((ch) => {
            const partner = getChannelAvatar(ch);
            return (
              <div
                key={ch._id}
                className={`sidebar-item ${activeChannel?._id === ch._id ? 'active' : ''}`}
                onClick={() => handleChannelClick(ch)}
              >
                <Avatar user={partner} size="sm" showStatus />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div className="sidebar-item-name">{getChannelName(ch)}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getLastMessagePreview(ch)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Current User Footer */}
      <div className="sidebar-user" onClick={toggleProfile} id="user-profile-btn">
        <Avatar user={user} size="sm" showStatus />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.username}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            ● Online
          </div>
        </div>
        <button
          className="icon-btn"
          onClick={(e) => { e.stopPropagation(); logout(); }}
          title="Logout"
          id="logout-btn"
          style={{ fontSize: '0.9rem' }}
        >
          🚪
        </button>
      </div>
    </aside>
  );
}
