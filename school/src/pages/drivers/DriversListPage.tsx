import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, IdCard, Pencil, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import StatusPill from '../../components/StatusPill';

type Driver = {
  id: string;
  user_id: string;
  license_number: string;
  is_active?: boolean;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
};

function driverLabel(d: Driver) {
  const full = [d.first_name, d.last_name].filter(Boolean).join(' ');
  return full || d.user_id;
}

export default function DriversListPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [userId, setUserId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let path = '/school/drivers';
      if (debouncedQuery) {
        path = `/school/drivers/search?q=${encodeURIComponent(debouncedQuery)}`;
      } else if (activeFilter) {
        path = `/school/drivers/filter?is_active=${activeFilter}`;
      }
      setDrivers((await api.get<Driver[]>(path)) ?? []);
    } catch {
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setUserId('');
    setLicenseNumber('');
    setIsActive(true);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (driver: Driver) => {
    setEditing(driver);
    setLicenseNumber(driver.license_number);
    setIsActive(driver.is_active ?? true);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (editing) {
      if (!licenseNumber) {
        setFormError('Please enter a license number.');
        return;
      }
    } else if (!userId || !licenseNumber) {
      setFormError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await api.put(`/school/drivers/${editing.id}`, { license_number: licenseNumber, is_active: isActive });
      } else {
        await api.post('/school/drivers', { user_id: userId, license_number: licenseNumber });
      }
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const removeDriver = async (driver: Driver) => {
    if (!confirm(`Remove ${driverLabel(driver)} as a school driver?`)) return;
    try {
      await api.delete(`/school/drivers/${driver.id}`);
      load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Could not remove driver.');
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">School Drivers</div>
          <div className="topbar-sub">{drivers.length} driver{drivers.length !== 1 ? 's' : ''}</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Link Driver
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
          ) : drivers.length === 0 ? (
            <EmptyState
              icon={<IdCard size={32} color="var(--color-text-light)" />}
              title="No drivers linked"
              text="Link a driver using the user ID they got when they signed up in the driver app."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>License Number</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{driverLabel(d)}</td>
                    <td>{d.license_number}</td>
                    <td><StatusPill active={d.is_active ?? true} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}>
                          <Pencil size={13} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => removeDriver(d)}>
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
        <Modal title={editing ? 'Edit Driver' : 'Link Driver'} onClose={() => setShowModal(false)}>
          {formError && <div className="form-error">{formError}</div>}
          {!editing && (
            <div className="field">
              <label className="field-label">Driver User ID</label>
              <input className="input" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Given to you by the driver" />
            </div>
          )}
          <div className="field">
            <label className="field-label">License Number</label>
            <input className="input" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} placeholder="DL-XXXXXXX" />
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
