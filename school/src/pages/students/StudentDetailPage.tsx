import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, Users } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/StatusPill';

type Student = { id: string; first_name: string; last_name: string; grade: string; is_active?: boolean };
type GuardianLink = {
  id: string;
  guardian_id: string;
  relationship?: string;
  is_primary?: boolean;
  first_name?: string;
  last_name?: string;
  phone?: string;
  [key: string]: unknown;
};

function guardianLabel(g: GuardianLink) {
  const full = [g.first_name, g.last_name].filter(Boolean).join(' ');
  return full || g.guardian_id;
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [student, setStudent] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [guardians, setGuardians] = useState<GuardianLink[]>([]);
  const [loadingGuardians, setLoadingGuardians] = useState(true);

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [guardianId, setGuardianId] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const loadStudent = useCallback(async () => {
    if (!id) return;
    setLoadingStudent(true);
    try {
      setStudent(await api.get<Student>(`/school/students/${id}`));
    } catch {
      setStudent(null);
    } finally {
      setLoadingStudent(false);
    }
  }, [id]);

  const loadGuardians = useCallback(async () => {
    if (!id) return;
    setLoadingGuardians(true);
    try {
      setGuardians((await api.get<GuardianLink[]>(`/school/students/${id}/guardians`)) ?? []);
    } catch {
      setGuardians([]);
    } finally {
      setLoadingGuardians(false);
    }
  }, [id]);

  useEffect(() => {
    loadStudent();
    loadGuardians();
  }, [loadStudent, loadGuardians]);

  const linkGuardian = async () => {
    if (!id) return;
    if (!guardianId || !relationship) {
      setLinkError('Enter a guardian ID and relationship.');
      return;
    }
    setLinking(true);
    setLinkError(null);
    try {
      await api.post(`/school/students/${id}/guardians`, {
        guardian_id: guardianId,
        relationship,
        is_primary: isPrimary,
      });
      setGuardianId('');
      setRelationship('');
      setIsPrimary(false);
      setShowLinkForm(false);
      loadGuardians();
    } catch (err) {
      setLinkError(err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setLinking(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/students')}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="topbar-title">
              {loadingStudent ? 'Loading…' : student ? `${student.first_name} ${student.last_name}` : 'Student not found'}
            </div>
            {student && <div className="topbar-sub">{student.grade}</div>}
          </div>
        </div>
        {student && <StatusPill active={student.is_active ?? true} />}
      </div>

      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Guardians</div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowLinkForm((v) => !v)}>
            <UserPlus size={14} /> Link Guardian
          </button>
        </div>

        {showLinkForm && (
          <div className="card" style={{ marginBottom: 16 }}>
            {linkError && <div className="form-error">{linkError}</div>}
            <div className="field">
              <label className="field-label">Guardian Profile ID</label>
              <input className="input" value={guardianId} onChange={(e) => setGuardianId(e.target.value)} placeholder="Given to you by the guardian" />
            </div>
            <div className="field">
              <label className="field-label">Relationship</label>
              <input className="input" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Mother, Father, Guardian..." />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginBottom: 4 }}>
              <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
              Primary guardian
            </label>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setShowLinkForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={linkGuardian} disabled={linking}>
                {linking ? <span className="spinner" /> : 'Link Guardian'}
              </button>
            </div>
          </div>
        )}

        <div className="table-wrap">
          {loadingGuardians ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="spinner" />
            </div>
          ) : guardians.length === 0 ? (
            <EmptyState
              icon={<Users size={32} color="var(--color-text-light)" />}
              title="No guardians linked"
              text="Link a guardian using the profile ID they share with you."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Guardian</th>
                  <th>Relationship</th>
                  <th>Primary</th>
                </tr>
              </thead>
              <tbody>
                {guardians.map((g) => (
                  <tr key={g.id}>
                    <td style={{ fontWeight: 600 }}>{guardianLabel(g)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{g.relationship ?? '—'}</td>
                    <td>{g.is_primary ? <StatusPill active activeLabel="Primary" /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
