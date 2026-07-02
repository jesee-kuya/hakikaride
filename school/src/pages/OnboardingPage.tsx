import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { School as SchoolIcon, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { api, ApiError } from '../lib/api';
import { setCachedSchool, markSchoolExists, type School } from '../lib/school';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !address || !contactEmail || !contactPhone) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      const school = await api.post<School>('/school', {
        name,
        address,
        contact_email: contactEmail,
        contact_phone: contactPhone,
      });
      if (user) setCachedSchool(user.id, school);
      navigate('/app', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        if (user) markSchoolExists(user.id);
        navigate('/app', { replace: true });
      } else {
        setError(err instanceof ApiError ? err.message : 'Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAlreadyCreated = () => {
    if (user) markSchoolExists(user.id);
    navigate('/app', { replace: true });
  };

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-brand">
          <div className="sidebar-logo" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>
            <SchoolIcon size={17} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-dark)' }}>Set Up Your School</div>
        </div>
        <div className="auth-sub">
          This creates the school your account manages. You can only create one school per admin account.
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <div className="field">
            <label className="field-label">School Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Greenfield Academy" />
          </div>
          <div className="field">
            <label className="field-label">Address</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Ngong Road, Nairobi" />
          </div>
          <div className="field">
            <label className="field-label">Contact Email</label>
            <input className="input" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="office@greenfield.ac.ke" />
          </div>
          <div className="field">
            <label className="field-label">Contact Phone</label>
            <input className="input" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Create School'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="link-btn" onClick={handleAlreadyCreated}>
            I've already created my school — continue
          </button>
        </div>

        <button
          className="btn btn-ghost"
          style={{ marginTop: 24, width: '100%' }}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </div>
  );
}
