import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      alert('Password reset. You can now sign in with your new password.');
      navigate('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <Link to="/login" className="link-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18 }}>
          <ArrowLeft size={15} /> Back to login
        </Link>
        <div className="auth-heading">Reset password</div>
        <div className="auth-sub">Enter the reset token you were given, along with your new password.</div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <label className="field-label">Reset Token</label>
            <input className="input" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Paste your reset token" />
          </div>
          <div className="field">
            <label className="field-label">New Password</label>
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="field">
            <label className="field-label">Confirm Password</label>
            <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
