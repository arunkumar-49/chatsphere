import { useState } from 'react';
import Modal from '../UI/Modal';
import Avatar from '../UI/Avatar';
import api from '../../api/axios';
import useChatStore from '../../store/chatStore';
import useUIStore from '../../store/uiStore';
export default function AddMemberModal({ channel, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const { updateChannel } = useChatStore();
  const { addToast } = useUIStore();
  // IDs of existing members
  const existingIds = channel.members?.map((m) => m._id) || [];
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
  const handleAdd = async (user) => {
    setAdding(user._id);
    try {
      const { data } = await api.put(`/channels/${channel._id}/members`, { userId: user._id });
      updateChannel(data.channel);
      addToast(`${user.username} added to #${channel.name}! 🎉`, 'success');
      // refresh results to show updated status
      setResults((prev) => prev.map((u) => u._id === user._id ? { ...u, _added: true } : u));
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to add member', 'error');
    } finally { setAdding(null); }
  };
  return (
    <Modal title={`➕ Add Members to #${channel.name}`} onClose={onClose}>
      <div style={{ padding: '0 20px 20px' }}>
        {/* Current Members */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Current Members ({channel.members?.length || 0})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {channel.members?.map((m) => (
              <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-hover)', borderRadius: 99, padding: '4px 10px 4px 4px' }}>
                <Avatar user={m} size="sm" showStatus={false} />
                <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{m.username}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Search */}
        <input
          id="add-member-search"
          className="form-input"
          type="text"
          placeholder="Search users to add..."
          value={query}
          onChange={handleSearch}
          autoFocus
          style={{ marginBottom: 12 }}
        />
        {/* Results */}
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 12 }}>Searching...</div>
          )}
          {!loading && results.length === 0 && query && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 12 }}>
              No users found for &quot;{query}&quot;
            </div>
          )}
          {results.map((user) => {
            const isAlreadyMember = existingIds.includes(user._id) || user._added;
            return (
              <div key={user._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <Avatar user={user} showStatus />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                </div>
                {isAlreadyMember ? (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '5px 10px' }}>✅ Member</span>
                ) : (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleAdd(user)}
                    disabled={adding === user._id}
                  >
                    {adding === user._id ? 'Adding...' : '+ Add'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
