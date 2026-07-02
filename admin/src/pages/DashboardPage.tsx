import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bus, Car, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ schoolTrips: 0, privateTrips: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [schoolTrips, privateTrips] = await Promise.all([
        api.get<unknown[]>('/admin/school-trips').catch(() => []),
        api.get<unknown[]>('/admin/private-trips').catch(() => []),
      ]);
      setCounts({
        schoolTrips: schoolTrips?.length ?? 0,
        privateTrips: privateTrips?.length ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  const quickLinks = [
    { icon: Bus, title: 'School Fleet', sub: 'Every school\'s buses currently on a trip', to: '/app/school-fleet' },
    { icon: Car, title: 'Private Fleet', sub: 'Every private driver currently on a trip', to: '/app/private-fleet' },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Platform Overview</div>
          <div className="topbar-sub">Live tracking oversight across every school and private driver</div>
        </div>
      </div>
      <div className="page">
        <div className="stat-grid">
          {[
            { icon: Bus, label: 'School Buses Live', value: counts.schoolTrips, color: '#3B82F6', bg: '#EFF6FF' },
            { icon: Car, label: 'Private Trips Live', value: counts.privateTrips, color: '#10B981', bg: '#ECFDF5' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: stat.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <stat.icon size={18} color={stat.color} />
              </div>
              <div className="stat-card-value">{loading ? '—' : stat.value}</div>
              <div className="stat-card-label">{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Quick Access</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {quickLinks.map((link) => (
            <button
              key={link.to}
              className="card"
              onClick={() => navigate(link.to)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                border: '1px solid var(--color-border)',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <link.icon size={20} color="var(--color-primary-dark)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{link.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginTop: 2 }}>{link.sub}</div>
              </div>
              <ChevronRight size={18} color="var(--color-text-light)" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
