import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
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
        <div className="auth-heading">Forgot password?</div>
        <div className="auth-sub">
          Enter your account email. If it matches a school admin account, you'll receive reset instructions.
        </div>

        {sent ? (
          <>
            <div className="card" style={{ marginBottom: 16, background: 'var(--color-background)', border: 'none' }}>
              If that email is registered, a reset link is on its way. Have your reset token ready.
            </div>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/reset-password')}>
              Enter Reset Token
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="field">
              <label className="field-label">Email</label>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@school.ac.ke" />
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <Link to="/reset-password" className="link-btn">Already have a reset token?</Link>
        </div>
      </div>
    </div>
  );
}
