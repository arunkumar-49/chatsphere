import { useState } from 'react';
import Modal from '../UI/Modal';
import Avatar from '../UI/Avatar';
import api from '../../api/axios';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addChannel, setActiveChannel } = useChatStore();
  const { closeUserSearch, addToast } = useUIStore();

  const handleSearch = async (e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.trim().length < 1) { setResults([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setResults(data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleStartDM = async (user) => {
    try {
      const { data } = await api.post('/channels/dm', { userId: user._id });
      addChannel(data.channel);
      setActiveChannel(data.channel);
      addToast(`Started chat with ${user.username}`, 'success');
      closeUserSearch();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to start DM', 'error');
    }
  };

  return (
    <Modal title="🔍 Find People" onClose={closeUserSearch}>
      <div style={{ padding: '0 20px 20px' }}>
        <input
          id="user-search-input"
          className="form-input"
          type="text"
          placeholder="Search by username or email..."
          value={query}
          onChange={handleSearch}
          autoFocus
          style={{ marginBottom: 12 }}
        />
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {loading && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 12 }}>Searching...</div>}
          {!loading && results.length === 0 && query && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 12 }}>No users found for &quot;{query}&quot;</div>}
          {results.map((user) => (
            <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <Avatar user={user} showStatus />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{user.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => handleStartDM(user)}>Message</button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
