import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bus as BusIcon, History } from 'lucide-react';
import { api } from '../../lib/api';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import EmptyState from '../../components/EmptyState';

type SchoolTripLocation = {
  bus_id: string;
  school_id: string;
  plate_number: string;
  trip_id: string;
  driver_id: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  recorded_at: string | null;
};

export default function SchoolFleetPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<SchoolTripLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [schoolId, setSchoolId] = useState('');
  const debouncedSchoolId = useDebouncedValue(schoolId);
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let path = '/admin/school-trips';
      if (debouncedQuery) {
        path = `/admin/school-trips/search?q=${encodeURIComponent(debouncedQuery)}`;
      } else if (debouncedSchoolId || activeFilter) {
        const params = new URLSearchParams();
        if (debouncedSchoolId) params.set('school_id', debouncedSchoolId);
        if (activeFilter) params.set('is_active', activeFilter);
        path = `/admin/school-trips/filter?${params.toString()}`;
      }
      setLocations((await api.get<SchoolTripLocation[]>(path)) ?? []);
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, debouncedSchoolId, activeFilter]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">School Fleet</div>
          <div className="topbar-sub">Every school's buses currently on a trip · refreshes every 15s</div>
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
              placeholder="Search by plate or model..."
            />
          </div>
          <input
            className="input"
            style={{ maxWidth: 220 }}
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            placeholder="Filter by school ID"
          />
          <select className="select" style={{ maxWidth: 150 }} value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as '' | 'true' | 'false')}>
            <option value="">All buses</option>
            <option value="true">Active only</option>
            <option value="false">Inactive only</option>
          </select>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="spinner" />
            </div>
          ) : locations.length === 0 ? (
            <EmptyState
              icon={<BusIcon size={32} color="var(--color-text-light)" />}
              title="No buses on a trip right now"
              text="Buses across every school appear here while a driver has an active trip in progress."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>School ID</th>
                  <th>Status</th>
                  <th>Position</th>
                  <th>Last Update</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.bus_id}>
                    <td style={{ fontWeight: 600 }}>{loc.plate_number}</td>
                    <td style={{ fontSize: 12.5, color: 'var(--color-text-secondary)' }}>{loc.school_id.slice(0, 8)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{loc.status}</td>
                    <td>
                      {loc.latitude != null && loc.longitude != null
                        ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`
                        : 'No fix yet'}
                    </td>
                    <td>{loc.recorded_at ? new Date(loc.recorded_at).toLocaleTimeString() : '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/app/trips/school-trips/${loc.trip_id}/history`)}>
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
