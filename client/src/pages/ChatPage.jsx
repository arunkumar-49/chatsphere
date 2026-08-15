import { useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import NotificationsPanel from '../components/Chat/NotificationsPanel';
import UserSearch from '../components/Sidebar/UserSearch';
import CreateChannel from '../components/Sidebar/CreateChannel';

import BrowseChannelsModal from '../components/UI/BrowseChannelsModal';
import PasswordPromptModal from '../components/UI/PasswordPromptModal';
import useChatStore from '../store/chatStore';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';
import useSocket from '../hooks/useSocket';

export default function ChatPage() {
  const { fetchChannels, unreadCount } = useChatStore();
  const { user } = useAuthStore();
  const {
    showNotifications,
    showUserSearch,
    showCreateChannel,

    showBrowseChannels,
    showPasswordPrompt,
    toggleNotifications,
    closeNotifications,
    theme,
  } = useUIStore();

  // Initialize socket connection
  useSocket();

  // Load channels on mount
  useEffect(() => {
    fetchChannels();
  }, []);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Close notifications on outside click
  const notifRef = useRef(null);

  return (
    <div className="app-layout">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {/* Top bar with notification bell */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            zIndex: 100,
            display: 'flex',
            gap: 8,
          }}
        >
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              id="notif-bell-btn"
              className="notif-btn"
              onClick={toggleNotifications}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 150 }}
                  onClick={closeNotifications}
                />
                <div style={{ position: 'relative', zIndex: 200 }}>
                  <NotificationsPanel />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Show Gaming Room or Chat Window */}
        <ChatWindow />
      </div>

      {/* Modals */}
      {showUserSearch && <UserSearch />}
      {showCreateChannel && <CreateChannel />}
      {showBrowseChannels && <BrowseChannelsModal />}
      {showPasswordPrompt && <PasswordPromptModal />}
    </div>
  );
}
