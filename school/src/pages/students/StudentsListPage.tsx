import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, GraduationCap, Pencil, Ban, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/StatusPill';

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  grade: string;
  is_active?: boolean;
};

export default function StudentsListPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [gradeFilter, setGradeFilter] = useState('');
  const debouncedGrade = useDebouncedValue(gradeFilter);
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [grade, setGrade] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let path = '/school/students';
      if (debouncedQuery) {
        path = `/school/students/search?q=${encodeURIComponent(debouncedQuery)}`;
      } else if (debouncedGrade || activeFilter) {
        const params = new URLSearchParams();
        if (debouncedGrade) params.set('grade', debouncedGrade);
        if (activeFilter) params.set('is_active', activeFilter);
        path = `/school/students/filter?${params.toString()}`;
      }
      setStudents((await api.get<Student[]>(path)) ?? []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, debouncedGrade, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setFirstName('');
    setLastName('');
    setGrade('');
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setFirstName(student.first_name);
    setLastName(student.last_name);
    setGrade(student.grade);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!firstName || !lastName || !grade) {
      setFormError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put(`/school/students/${editing.id}`, { first_name: firstName, last_name: lastName, grade });
      } else {
        await api.post('/school/students', { first_name: firstName, last_name: lastName, grade });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (student: Student) => {
    try {
      await api.patch(`/school/students/${student.id}/manage`, { is_active: !student.is_active });
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not update student status.');
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Students</div>
          <div className="topbar-sub">{students.length} student{students.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      <div className="page">
        <div className="toolbar">
          <div className="input search-input" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} color="var(--color-text-light)" />
            <input
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name..."
            />
          </div>
          <input
            className="input"
            style={{ maxWidth: 140 }}
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            placeholder="Grade filter"
          />
          <select className="select" style={{ maxWidth: 150 }} value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as '' | 'true' | 'false')}>
            <option value="">All statuses</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="spinner" />
            </div>
          ) : students.length === 0 ? (
            <EmptyState icon={<GraduationCap size={32} color="var(--color-text-light)" />} title="No students found" text="Add a student to get started." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Grade</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="row-clickable" onClick={() => navigate(`/app/students/${s.id}`)}>
                    <td style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</td>
                    <td>{s.grade}</td>
                    <td><StatusPill active={s.is_active ?? true} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(s)}>
                          {s.is_active ?? true ? <Ban size={13} /> : <CheckCircle2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Student' : 'Add Student'} onClose={() => setShowModal(false)}>
          {formError && <div className="form-error">{formError}</div>}
          <div className="field">
            <label className="field-label">First Name</label>
            <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Last Name</label>
            <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Grade</label>
            <input className="input" value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Grade 4" />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Save'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
