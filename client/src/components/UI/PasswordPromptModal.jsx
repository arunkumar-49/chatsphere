import { useState } from 'react';
import Modal from './Modal';
import api from '../../api/axios';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';

export default function PasswordPromptModal() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { addChannel, setActiveChannel } = useChatStore();
  const { showPasswordPrompt: channel, closePasswordPrompt, addToast } = useUIStore();

  if (!channel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return setError('Password is required');
    setLoading(true);
    try {
      const { data } = await api.post(`/channels/${channel._id}/join`, { password: password.trim() });
      addChannel(data.channel);
      setActiveChannel(data.channel);
      addToast(`Joined #${data.channel.name}! 🔓`, 'success');
      closePasswordPrompt();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join channel');
    } finally { setLoading(false); }
  };

  return (
    <Modal title="🔒 Password Required" onClose={closePasswordPrompt}>
      <div style={{ padding: '0 22px 22px' }}>
        <div className="password-prompt-icon">🔐</div>
        <p className="password-prompt-text">
          <strong>#{channel.name}</strong> is password-protected.<br />
          Enter the password to join this channel.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              className="form-input"
              type="password"
              placeholder="Enter channel password..."
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoFocus
            />
          </div>
          {error && <p className="form-error" style={{ marginTop: 8 }}>⚠️ {error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18 }}>
            <button type="button" className="btn btn-secondary" onClick={closePasswordPrompt}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Joining...' : '🔓 Join Channel'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
