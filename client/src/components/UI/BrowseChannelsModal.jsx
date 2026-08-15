import { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../../api/axios';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import useUIStore from '../../store/uiStore';

export default function BrowseChannelsModal() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { addChannel, setActiveChannel } = useChatStore();
  const { closeBrowseChannels, openPasswordPrompt, addToast } = useUIStore();

  useEffect(() => {
    const fetchPublic = async () => {
      try {
        const { data } = await api.get('/channels/public');
        setChannels(data.channels);
      } catch (err) {
        console.error('Failed to fetch public channels', err);
      } finally { setLoading(false); }
    };
    fetchPublic();
  }, []);

  const handleJoin = async (channel) => {
    // If already a member, just open it
    if (channel.isMember) {
      setActiveChannel(channel);
      closeBrowseChannels();

      return;
    }

    // If password protected, show password prompt
    if (channel.isPasswordProtected) {
      openPasswordPrompt(channel);
      closeBrowseChannels();
      return;
    }

    // Join directly
    try {
      const { data } = await api.post(`/channels/${channel._id}/join`, {});
      addChannel(data.channel);
      setActiveChannel(data.channel);
      addToast(`Joined #${data.channel.name}! 🎉`, 'success');
      closeBrowseChannels();

    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to join', 'error');
    }
  };

  return (
    <Modal title="🔍 Browse Channels" onClose={closeBrowseChannels}>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 30 }}>
          <span className="spinner" />
        </div>
      ) : channels.length === 0 ? (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>📭</p>
          <p>No channels available yet. Create one!</p>
        </div>
      ) : (
        <div className="browse-channel-list">
          {channels.map((ch) => (
            <div key={ch._id} className="browse-channel-item" onClick={() => handleJoin(ch)}>
              <div className="browse-channel-icon">
                {ch.isPasswordProtected ? '🔒' : '#'}
              </div>
              <div className="browse-channel-info">
                <div className="browse-channel-name">
                  {ch.name}
                  {ch.isPasswordProtected && <span className="channel-lock-icon">🔒</span>}
                </div>
                {ch.description && (
                  <div className="browse-channel-desc">{ch.description}</div>
                )}
              </div>
              <div className="browse-channel-meta">
                {ch.memberCount} {ch.memberCount === 1 ? 'member' : 'members'}
              </div>
              <button
                className={`btn ${ch.isMember ? 'btn-secondary' : 'btn-primary'} browse-channel-join-btn`}
                onClick={(e) => { e.stopPropagation(); handleJoin(ch); }}
              >
                {ch.isMember ? 'Open' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
