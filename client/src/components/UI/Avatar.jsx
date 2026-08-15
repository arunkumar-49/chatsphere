const SERVER_URL = 'http://localhost:5000';

export default function Avatar({ user, size = 'md', showStatus = true }) {
  const getInitials = (name) => (!name ? '?' : name.slice(0, 2).toUpperCase());
  const avatarUrl = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${SERVER_URL}${user.avatar}`) : null;

  return (
    <div className={`avatar ${size}`}>
      {avatarUrl
        ? <img src={avatarUrl} alt={user?.username || 'User'} />
        : <div className="avatar-placeholder">{getInitials(user?.username)}</div>
      }
      {showStatus && <span className={`avatar-status ${user?.status || 'offline'}`} />}
    </div>
  );
}