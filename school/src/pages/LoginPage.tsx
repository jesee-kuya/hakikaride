import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navigation, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';
import { getCachedSchool } from '../lib/school';

type Tab = 'login' | 'signup';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');
  const [showSignupPass, setShowSignupPass] = useState(false);

  const afterAuth = (userId: string) => {
    const school = getCachedSchool(userId);
    navigate(school ? '/app' : '/onboarding', { replace: true });
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError('Please fill in your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await login(loginEmail, loginPassword);
      afterAuth(user.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!signupUsername || !signupEmail || !signupPassword || !signupConfirm) {
      setError('Please fill in all fields.');
      return;
    }
    if (signupUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (signupPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setError('Your passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await signup(signupUsername, signupEmail, signupPassword);
      afterAuth(user.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="sidebar-logo" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>
            <Navigation size={17} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-dark)' }}>HakikaRide School</div>
        </div>

        <div className="auth-heading">{tab === 'login' ? 'Welcome back' : 'Create your admin account'}</div>
        <div className="auth-sub">
          {tab === 'login'
            ? 'Sign in to manage your school\'s students, buses, and fleet.'
            : 'Set up your school back-office account.'}
        </div>

        <div className="tab-row">
          <button className={`tab-btn${tab === 'login' ? ' active' : ''}`} onClick={() => setTab('login')} type="button">
            Login
          </button>
          <button className={`tab-btn${tab === 'signup' ? ' active' : ''}`} onClick={() => setTab('signup')} type="button">
            Sign Up
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label className="field-label">Email</label>
              <input
                className="input"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@school.ac.ke"
              />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showLoginPass ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPass((v) => !v)}
                  style={{ position: 'absolute', right: 10, top: 9, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}
                >
                  {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link to="/forgot-password" className="link-btn">Forgot password?</Link>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup}>
            <div className="field">
              <label className="field-label">Username</label>
              <input className="input" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} placeholder="school_admin" />
            </div>
            <div className="field">
              <label className="field-label">Email</label>
              <input className="input" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} placeholder="admin@school.ac.ke" />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showSignupPass ? 'text' : 'password'}
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowSignupPass((v) => !v)}
                  style={{ position: 'absolute', right: 10, top: 9, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}
                >
                  {showSignupPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Confirm Password</label>
              <input className="input" type="password" value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} placeholder="••••••••" />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 22, fontSize: 12, color: 'var(--color-text-light)', justifyContent: 'center' }}>
          <User size={13} />
          School admin accounts only
        </div>
      </div>
    </div>
  );
}
