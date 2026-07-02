import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car, History } from 'lucide-react';
import { api } from '../../lib/api';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

type PrivateTripLocation = {
  trip_id: string;
  driver_id: string;
  match_id: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  recorded_at: string | null;
};

type StatusFilter = '' | 'pending' | 'in_progress' | 'completed' | 'cancelled';

export default function PrivateFleetPage() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<PrivateTripLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let path = '/admin/private-trips';
      if (debouncedQuery) {
        path = `/admin/private-trips/search?q=${encodeURIComponent(debouncedQuery)}`;
      } else if (statusFilter) {
        path = `/admin/private-trips/filter?status=${statusFilter}`;
      }
      setTrips((await api.get<PrivateTripLocation[]>(path)) ?? []);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, statusFilter]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Private Fleet</div>
          <div className="topbar-sub">Every private driver currently on a trip · refreshes every 15s</div>
        </div>
      </div>

      <div className="page">
        <div className="toolbar">
          <div className="input search-input" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} color="var(--color-text-light)" />
            <input
              style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14 }}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by driver name..."
            />
          </div>
          <select className="select" style={{ maxWidth: 180 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="spinner" />
            </div>
          ) : trips.length === 0 ? (
            <EmptyState
              icon={<Car size={32} color="var(--color-text-light)" />}
              title="No private trips right now"
              text="Live private-driver trips across the platform appear here."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Driver ID</th>
                  <th>Match ID</th>
                  <th>Status</th>
                  <th>Position</th>
                  <th>Last Update</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.trip_id}>
                    <td style={{ fontWeight: 600, fontSize: 12.5 }}>{t.driver_id.slice(0, 8)}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>{t.match_id.slice(0, 8)}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      {t.latitude != null && t.longitude != null
                        ? `${t.latitude.toFixed(5)}, ${t.longitude.toFixed(5)}`
                        : 'No fix yet'}
                    </td>
                    <td>{t.recorded_at ? new Date(t.recorded_at).toLocaleTimeString() : '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/app/trips/private-trips/${t.trip_id}/history`)}>
                        <History size={13} /> Breadcrumbs
                      </button>
                    </td>
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
