import { useState } from 'react';
import Modal from '../UI/Modal';
import api from '../../api/axios';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';

export default function CreateChannel() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addChannel, setActiveChannel } = useChatStore();
  const { closeCreateChannel, addToast } = useUIStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Channel name is required');
    if (name.length < 2) return setError('Name must be at least 2 characters');
    if (isPasswordProtected && !password.trim()) return setError('Password is required for protected channels');
    setLoading(true);
    try {
      const payload = { name: name.trim(), description: description.trim() };
      if (isPasswordProtected && password.trim()) {
        payload.password = password.trim();
      }
      const { data } = await api.post('/channels', payload);
      addChannel(data.channel);
      setActiveChannel(data.channel);
      addToast(`#${data.channel.name} created! 🎉`, 'success');
      closeCreateChannel();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create channel');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="# Create Channel" onClose={closeCreateChannel}>
      <form onSubmit={handleSubmit} style={{ padding: '0 22px 22px' }}>
        <div className="form-group">
          <label className="form-label">Channel Name *</label>
          <input id="channel-name-input" className="form-input" type="text" placeholder="general, announcements..." value={name} onChange={(e) => { setName(e.target.value); setError(''); }} maxLength={50} autoFocus />
        </div>
        <div className="form-group" style={{ marginTop: 14 }}>
          <label className="form-label">Description (optional)</label>
          <input className="form-input" type="text" placeholder="What's this channel about?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} />
        </div>

        {/* Password Protection Toggle */}
        <div className="toggle-row" style={{ marginTop: 16 }}>
          <label>
            🔒 Password Protected
          </label>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isPasswordProtected}
              onChange={(e) => setIsPasswordProtected(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {isPasswordProtected && (
          <div className="form-group" style={{ marginTop: 10 }}>
            <label className="form-label">Channel Password *</label>
            <input
              className="form-input"
              type="password"
              placeholder="Set a password for this channel"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              maxLength={100}
            />
          </div>
        )}

        {error && <p className="form-error" style={{ marginTop: 10 }}>⚠️ {error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
          <button type="button" className="btn btn-secondary" onClick={closeCreateChannel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Channel'}</button>
        </div>
      </form>
    </Modal>
  );
}
