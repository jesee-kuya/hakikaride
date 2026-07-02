import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPinned, History } from 'lucide-react';
import { api } from '../../lib/api';
import { useDebouncedValue } from '../../lib/useDebouncedValue';
import EmptyState from '../../components/EmptyState';

type FleetLocation = {
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

export default function FleetPage() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<FleetLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let path = '/school/locations';
      if (debouncedQuery) {
        path = `/school/locations/search?q=${encodeURIComponent(debouncedQuery)}`;
      } else if (activeFilter) {
        path = `/school/locations/filter?is_active=${activeFilter}`;
      }
      setLocations((await api.get<FleetLocation[]>(path)) ?? []);
    } catch {
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, activeFilter]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Live Fleet</div>
          <div className="topbar-sub">Buses currently on a trip · refreshes every 15s</div>
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
          <select className="select" style={{ maxWidth: 150 }} value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as '' | 'true' | 'false')}>
            <option value="">All</option>
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
              icon={<MapPinned size={32} color="var(--color-text-light)" />}
              title="No buses on a trip right now"
              text="Buses appear here while a driver has an active trip in progress."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Plate</th>
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
                    <td style={{ textTransform: 'capitalize' }}>{loc.status}</td>
                    <td>
                      {loc.latitude != null && loc.longitude != null
                        ? `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`
                        : 'No fix yet'}
                    </td>
                    <td>{loc.recorded_at ? new Date(loc.recorded_at).toLocaleTimeString() : '—'}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/app/trips/${loc.trip_id}/history`)}>
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
