import { useCallback, useEffect, useState } from 'react';
import { Plus, Handshake, Car } from 'lucide-react';
import { api, ApiError } from '../../lib/api';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';

type Tab = 'drivers' | 'trips';

type PrivateDriver = {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  license_number?: string;
  [key: string]: unknown;
};

type PrivateTrip = {
  id: string;
  status: string;
  started_at: string;
  driver_id?: string;
  [key: string]: unknown;
};

function driverLabel(d: PrivateDriver) {
  const full = [d.first_name, d.last_name].filter(Boolean).join(' ');
  return full || d.id;
}

export default function PrivatePage() {
  const [tab, setTab] = useState<Tab>('drivers');

  const [drivers, setDrivers] = useState<PrivateDriver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);

  const [trips, setTrips] = useState<PrivateTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  const [showConnect, setShowConnect] = useState(false);
  const [driverId, setDriverId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [selectedTrip, setSelectedTrip] = useState<PrivateTrip | null>(null);

  const loadDrivers = useCallback(async () => {
    setLoadingDrivers(true);
    try {
      setDrivers((await api.get<PrivateDriver[]>('/school/private-drivers')) ?? []);
    } catch {
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  }, []);

  const loadTrips = useCallback(async () => {
    setLoadingTrips(true);
    try {
      setTrips((await api.get<PrivateTrip[]>('/school/private-trips')) ?? []);
    } catch {
      setTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    loadDrivers();
    loadTrips();
  }, [loadDrivers, loadTrips]);

  const connectDriver = async () => {
    if (!driverId) {
      setConnectError('Enter a private driver profile ID.');
      return;
    }
    setConnecting(true);
    setConnectError(null);
    try {
      await api.post('/school/private-drivers', { driver_id: driverId });
      setDriverId('');
      setShowConnect(false);
      loadDrivers();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setConnectError('That driver is already connected to your school.');
      } else {
        setConnectError(err instanceof ApiError ? err.message : 'Please try again.');
      }
    } finally {
      setConnecting(false);
    }
  };

  const viewTrip = async (trip: PrivateTrip) => {
    try {
      setSelectedTrip(await api.get<PrivateTrip>(`/school/private-trips/${trip.id}`));
    } catch {
      setSelectedTrip(trip);
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Private Drivers</div>
          <div className="topbar-sub">Independent drivers authorized to serve your students</div>
        </div>
        {tab === 'drivers' && (
          <button className="btn btn-primary" onClick={() => setShowConnect(true)}>
            <Plus size={16} /> Connect Driver
          </button>
        )}
      </div>

      <div className="page">
        <div className="tab-row" style={{ maxWidth: 340 }}>
          <button className={`tab-btn${tab === 'drivers' ? ' active' : ''}`} onClick={() => setTab('drivers')}>
            Connected Drivers
          </button>
          <button className={`tab-btn${tab === 'trips' ? ' active' : ''}`} onClick={() => setTab('trips')}>
            Active Trips
          </button>
        </div>

        {tab === 'drivers' && (
          <div className="table-wrap">
            {loadingDrivers ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <span className="spinner" />
              </div>
            ) : drivers.length === 0 ? (
              <EmptyState
                icon={<Handshake size={32} color="var(--color-text-light)" />}
                title="No private drivers connected"
                text="Connect a driver using their private driver profile ID."
              />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Phone</th>
                    <th>License</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{driverLabel(d)}</td>
                      <td>{d.phone ?? '—'}</td>
                      <td>{d.license_number ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {tab === 'trips' && (
          <div className="table-wrap">
            {loadingTrips ? (
              <div style={{ padding: 40, textAlign: 'center' }}>
                <span className="spinner" />
              </div>
            ) : trips.length === 0 ? (
              <EmptyState icon={<Car size={32} color="var(--color-text-light)" />} title="No active private trips" text="Trips run by your connected drivers will show up here." />
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Status</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((t) => (
                    <tr key={t.id} className="row-clickable" onClick={() => viewTrip(t)}>
                      <td style={{ fontWeight: 600 }}>{t.id.slice(0, 8)}</td>
                      <td style={{ textTransform: 'capitalize' }}>{t.status}</td>
                      <td>{new Date(t.started_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showConnect && (
        <Modal title="Connect a Private Driver" onClose={() => setShowConnect(false)}>
          {connectError && <div className="form-error">{connectError}</div>}
          <div className="field">
            <label className="field-label">Driver Profile ID</label>
            <input className="input" value={driverId} onChange={(e) => setDriverId(e.target.value)} placeholder="An existing private driver's profile ID" />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowConnect(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={connectDriver} disabled={connecting}>
              {connecting ? <span className="spinner" /> : 'Connect'}
            </button>
          </div>
        </Modal>
      )}

      {selectedTrip && (
        <Modal title="Trip Details" onClose={() => setSelectedTrip(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
            {Object.entries(selectedTrip).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span className="text-muted" style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                <span style={{ fontWeight: 600, textAlign: 'right' }}>{String(value ?? '—')}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
