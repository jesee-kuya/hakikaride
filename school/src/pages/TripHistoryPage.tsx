import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPinOff } from 'lucide-react';
import { api } from '../lib/api';
import EmptyState from '../components/EmptyState';

type LocationPoint = { id: string; trip_id: string; latitude: number; longitude: number; recorded_at: string };

export default function TripHistoryPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const [points, setPoints] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    try {
      setPoints((await api.get<LocationPoint[]>(`/school/trips/${tripId}/location/history`)) ?? []);
    } catch {
      setPoints([]);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="topbar-title">Route Breadcrumbs</div>
            <div className="topbar-sub">{points.length} recorded point{points.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      <div className="page">
        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <span className="spinner" />
            </div>
          ) : points.length === 0 ? (
            <EmptyState icon={<MapPinOff size={32} color="var(--color-text-light)" />} title="No location history for this trip yet." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Coordinates</th>
                  <th>Recorded At</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={p.id}>
                    <td>{points.length - i}</td>
                    <td>{p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}</td>
                    <td>{new Date(p.recorded_at).toLocaleString()}</td>
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
