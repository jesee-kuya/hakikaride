import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { getCachedSchool } from '../lib/school';

export default function RequireSchool() {
  const { user } = useAuth();
  if (!user) return null;

  const school = getCachedSchool(user.id);
  if (!school) return <Navigate to="/onboarding" replace />;

  return <Outlet />;
}
