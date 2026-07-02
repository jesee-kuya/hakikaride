import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPinned, History } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import { usePolling } from '../../lib/usePolling';
import StatusPill from '../../components/StatusPill';

type Bus = { id: string; plate_number: string; model: string; capacity: number; is_active?: boolean };
type Trip = { id: string; status: string; trip_type?: string; started_at: string; [key: string]: unknown };
type LocationPoint = { id: string; trip_id: string; latitude: number; longitude: number; recorded_at: string };

export default function BusDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [bus, setBus] = useState<Bus | null>(null);
  const [loadingBus, setLoadingBus] = useState(true);

  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [loadingTrip, setLoadingTrip] = useState(true);

  const loadBus = useCallback(async () => {
    if (!id) return;
    setLoadingBus(true);
    try {
      setBus(await api.get<Bus>(`/school/buses/${id}`));
    } catch {
      setBus(null);
    } finally {
      setLoadingBus(false);
    }
  }, [id]);

  const loadTrip = useCallback(async () => {
    if (!id) return;
    setLoadingTrip(true);
    try {
      setTrip(await api.get<Trip>(`/school/buses/${id}/track`));
    } catch (e) {
      setTrip(e instanceof ApiError && e.status === 404 ? null : null);
    } finally {
      setLoadingTrip(false);
    }
  }, [id]);

  useEffect(() => {
    loadBus();
    loadTrip();
  }, [loadBus, loadTrip]);

  const isLive = trip != null;

  const locationPolling = usePolling<LocationPoint>(
    useCallback(() => api.get<LocationPoint>(`/school/buses/${id}/location`), [id]),
    8000,
    isLive,
  );

  return (
    <>
      <div className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/app/buses')}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="topbar-title">{loadingBus ? 'Loading…' : bus ? bus.plate_number : 'Bus not found'}</div>
            {bus && <div className="topbar-sub">{bus.model} · {bus.capacity} seats</div>}
          </div>
        </div>
        {bus && <StatusPill active={bus.is_active ?? true} />}
      </div>

      <div className="page">
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Live Status</div>
        {loadingTrip ? (
          <div style={{ padding: 24, textAlign: 'center' }}>
            <span className="spinner" />
          </div>
        ) : isLive ? (
          <div className="card" style={{ background: 'var(--color-dark)', color: 'var(--color-white)', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 5, background: 'var(--color-success)' }} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>Trip in progress</span>
            </div>
            <div style={{ fontSize: 12.5, color: '#9CA3AF', marginTop: 6, textTransform: 'capitalize' }}>
              {trip?.trip_type ? `${trip.trip_type} · ` : ''}status: {trip?.status}
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '14px 0' }} />
            {locationPolling.data ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
                <MapPinned size={16} color="var(--color-primary)" />
                {locationPolling.data.latitude.toFixed(5)}, {locationPolling.data.longitude.toFixed(5)}
              </div>
            ) : locationPolling.error ? (
              <div style={{ fontSize: 12.5, color: '#F87171' }}>{locationPolling.error}</div>
            ) : (
              <span className="spinner spinner-light" />
            )}
            {trip?.id && (
              <button
                className="btn btn-ghost btn-sm mt-16"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-white)' }}
                onClick={() => navigate(`/app/trips/${trip.id}/history`)}
              >
                <History size={14} /> View route breadcrumbs
              </button>
            )}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            No trip in progress right now.
          </div>
        )}
      </div>
    </>
  );
}
