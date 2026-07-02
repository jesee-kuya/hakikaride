import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RequireSchool from './components/RequireSchool';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import TripHistoryPage from './pages/TripHistoryPage';

import StudentsListPage from './pages/students/StudentsListPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import BusesListPage from './pages/buses/BusesListPage';
import BusDetailPage from './pages/buses/BusDetailPage';
import DriversListPage from './pages/drivers/DriversListPage';
import PrivatePage from './pages/privateDrivers/PrivatePage';
import FleetPage from './pages/fleet/FleetPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<OnboardingPage />} />

        <Route element={<RequireSchool />}>
          <Route path="/app" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="students" element={<StudentsListPage />} />
            <Route path="students/:id" element={<StudentDetailPage />} />
            <Route path="buses" element={<BusesListPage />} />
            <Route path="buses/:id" element={<BusDetailPage />} />
            <Route path="drivers" element={<DriversListPage />} />
            <Route path="private" element={<PrivatePage />} />
            <Route path="fleet" element={<FleetPage />} />
            <Route path="trips/:tripId/history" element={<TripHistoryPage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
