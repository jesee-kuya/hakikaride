import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Bus, IdCard, MapPinned, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { getCachedSchool } from '../lib/school';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const school = user ? getCachedSchool(user.id) : null;

  const [counts, setCounts] = useState({ students: 0, buses: 0, drivers: 0, liveFleet: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [students, buses, drivers, locations] = await Promise.all([
        api.get<unknown[]>('/school/students').catch(() => []),
        api.get<unknown[]>('/school/buses').catch(() => []),
        api.get<unknown[]>('/school/drivers').catch(() => []),
        api.get<unknown[]>('/school/locations').catch(() => []),
      ]);
      setCounts({
        students: students?.length ?? 0,
        buses: buses?.length ?? 0,
        drivers: drivers?.length ?? 0,
        liveFleet: locations?.length ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  const quickLinks = [
    { icon: GraduationCap, title: 'Manage Students', sub: 'Enroll, search, and link guardians', to: '/app/students' },
    { icon: Bus, title: 'Manage Buses', sub: 'Fleet vehicles and live trip tracking', to: '/app/buses' },
    { icon: IdCard, title: 'Manage Drivers', sub: 'Link school driver accounts', to: '/app/drivers' },
    { icon: MapPinned, title: 'Live Fleet', sub: 'See buses currently on a trip', to: '/app/fleet' },
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">{school?.name || 'Dashboard'}</div>
          <div className="topbar-sub">Overview of your school's students, fleet, and drivers</div>
        </div>
      </div>
      <div className="page">
        <div className="stat-grid">
          {[
            { icon: GraduationCap, label: 'Students', value: counts.students, color: '#8B5CF6', bg: '#F5F3FF' },
            { icon: Bus, label: 'Buses', value: counts.buses, color: '#3B82F6', bg: '#EFF6FF' },
            { icon: IdCard, label: 'School Drivers', value: counts.drivers, color: '#10B981', bg: '#ECFDF5' },
            { icon: MapPinned, label: 'Live Now', value: counts.liveFleet, color: '#F59E0B', bg: '#FEF3C7' },
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
