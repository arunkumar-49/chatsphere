import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) return setError('All fields are required');
    if (form.username.length < 3) return setError('Username must be at least 3 characters');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setIsLoading(true);
    try {
      await register(form.username, form.email, form.password);
      addToast('Account created! Welcome 🚀', 'success');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-card">
        <div className="auth-logo">
          <h1>💬 ChatSphere</h1>
          <p>Create your free account today</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input id="reg-username" className="form-input" type="text" name="username" placeholder="cooluser123" value={form.username} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="reg-email" className="form-input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" className="form-input" type="password" name="password" placeholder="At least 6 characters" value={form.password} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input id="reg-confirm" className="form-input" type="password" name="confirm" placeholder="Repeat password" value={form.confirm} onChange={handleChange} />
          </div>
          {error && <p className="form-error">⚠️ {error}</p>}
          <button id="reg-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
            {isLoading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Creating...</> : '→ Create Account'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in →</Link></p>
      </div>
    </div>
  );
}