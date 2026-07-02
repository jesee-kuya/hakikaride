import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import TripHistoryPage from './pages/TripHistoryPage';

import SchoolFleetPage from './pages/schoolFleet/SchoolFleetPage';
import PrivateFleetPage from './pages/privateFleet/PrivateFleetPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="school-fleet" element={<SchoolFleetPage />} />
          <Route path="private-fleet" element={<PrivateFleetPage />} />
          <Route path="trips/:kind/:tripId/history" element={<TripHistoryPage />} />
          <Route path="change-password" element={<ChangePasswordPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
