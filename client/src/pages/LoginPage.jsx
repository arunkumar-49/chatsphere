import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useUIStore from '../store/uiStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Please fill in all fields');
    setIsLoading(true);
    try {
      await login(form.email, form.password);
      addToast('Welcome back! 🎉', 'success');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />
      <div className="auth-card">
        <div className="auth-logo">
          <h1>💬 ChatSphere</h1>
          <p>Connect with your team in real-time</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="login-email" className="form-input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="login-password" className="form-input" type="password" name="password" placeholder="Enter your password" value={form.password} onChange={handleChange} autoComplete="current-password" />
          </div>
          {error && <p className="form-error">⚠️ {error}</p>}
          <button id="login-submit" type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
            {isLoading ? <><span className="spinner" style={{ width: 18, height: 18 }} /> Signing in...</> : '→ Sign In'}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <p className="auth-switch">Don&apos;t have an account? <Link to="/register">Create one free →</Link></p>
      </div>
    </div>
  );
}