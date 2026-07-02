import { useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { ApiError } from '../lib/api';

export default function ChangePasswordPage() {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!currentPassword || !newPassword || !confirmPassword) {
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
      await changePassword(currentPassword, newPassword);
      alert('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Change Password</div>
          <div className="topbar-sub">Update your school admin account password</div>
        </div>
      </div>
      <div className="page">
        <div className="card" style={{ maxWidth: 420 }}>
          <form onSubmit={handleSubmit}>
            {error && <div className="form-error">{error}</div>}
            <div className="field">
              <label className="field-label">Current Password</label>
              <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">New Password</label>
              <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="field">
              <label className="field-label">Confirm New Password</label>
              <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
