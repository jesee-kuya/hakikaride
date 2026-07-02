import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Bus as BusIcon, Pencil, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/StatusPill';

type Bus = {
  id: string;
  plate_number: string;
  model: string;
  capacity: number;
  is_active?: boolean;
};

export default function BusesListPage() {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Bus | null>(null);
  const [plateNumber, setPlateNumber] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let path = '/school/buses';
      if (debouncedQuery) {
        path = `/school/buses/search?q=${encodeURIComponent(debouncedQuery)}`;
      } else if (activeFilter) {
        path = `/school/buses/filter?is_active=${activeFilter}`;
      }
      setBuses((await api.get<Bus[]>(path)) ?? []);
    } catch {
      setBuses([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setPlateNumber('');
    setModel('');
    setCapacity('');
    setIsActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (bus: Bus) => {
    setEditing(bus);
    setPlateNumber(bus.plate_number);
    setModel(bus.model);
    setCapacity(String(bus.capacity));
    setIsActive(bus.is_active ?? true);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!plateNumber || !model || !capacity) {
      setFormError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put(`/school/buses/${editing.id}`, {
          plate_number: plateNumber,
          model,
          capacity: Number(capacity),
          is_active: isActive,
        });
      } else {
        await api.post('/school/buses', { plate_number: plateNumber, model, capacity: Number(capacity) });
      }
      setShowModal(false);
      load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setFormError('That plate number is already in use.');
      } else {
        setFormError(err instanceof ApiError ? err.message : 'Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const deactivateBus = async (bus: Bus) => {
    if (!confirm(`Deactivate bus ${bus.plate_number}?`)) return;
    try {
      await api.delete(`/school/buses/${bus.id}`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not deactivate bus.');
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Buses</div>
          <div className="topbar-sub">{buses.length} bus{buses.length !== 1 ? 'es' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Bus
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
              placeholder="Search by plate or model..."
            />
          </div>
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
          ) : buses.length === 0 ? (
            <EmptyState icon={<BusIcon size={32} color="var(--color-text-light)" />} title="No buses found" text="Add a bus to get started." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Model</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {buses.map((b) => (
                  <tr key={b.id} className="row-clickable" onClick={() => navigate(`/app/buses/${b.id}`)}>
                    <td style={{ fontWeight: 600 }}>{b.plate_number}</td>
                    <td>{b.model}</td>
                    <td>{b.capacity}</td>
                    <td><StatusPill active={b.is_active ?? true} /></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => deactivateBus(b)}>
                          <Trash2 size={13} />
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
        <Modal title={editing ? 'Edit Bus' : 'Add Bus'} onClose={() => setShowModal(false)}>
          {formError && <div className="form-error">{formError}</div>}
          <div className="field">
            <label className="field-label">Plate Number</label>
            <input className="input" value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} placeholder="KCA 001A" />
          </div>
          <div className="field">
            <label className="field-label">Model</label>
            <input className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Toyota Coaster" />
          </div>
          <div className="field">
            <label className="field-label">Capacity</label>
            <input className="input" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="32" />
          </div>
          {editing && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, marginBottom: 4 }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
          )}
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
