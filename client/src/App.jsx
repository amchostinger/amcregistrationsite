/**
 * App.jsx — Root routing configuration
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Schedule from './pages/Schedule';
import Speakers from './pages/Speakers';
import Hotels from './pages/Hotels';
import Resources from './pages/Resources';
import Venue from './pages/Venue';
import Register from './pages/Register';
import PaymentStatus from './pages/PaymentStatus.new';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSettings from './pages/admin/AdminSettings';
import AdminSpeakers from './pages/admin/AdminSpeakers';
import AdminResources from './pages/admin/AdminResources';
import AdminAwards from './pages/admin/AdminAwards';
import AdminSchedule from './pages/admin/AdminSchedule';
import AdminHotels from './pages/admin/AdminHotels';

/** Redirects to /admin/login if not authenticated */
function ProtectedRoute({ children }) {
  const { isSignedIn, loading } = useAuth();
  if (loading) return null; // wait for token verification
  return isSignedIn ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public Routes ─────────────────────────────────────── */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <main>
                <Home />
              </main>
              <Footer />
            </>
          }
        />
        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <main className="pt-20">
                <About />
              </main>
              <Footer />
            </>
          }
        />
        <Route
          path="/schedule"
          element={
            <>
              <Navbar />
              <main className="pt-20">
                <Schedule />
              </main>
              <Footer />
            </>
          }
        />
        <Route
          path="/speakers"
          element={
            <>
              <Navbar />
              <main className="pt-20">
                <Speakers />
              </main>
              <Footer />
            </>
          }
        />
        <Route
          path="/venue"
          element={
            <>
              <Navbar />
              <main className="pt-20">
                <Venue />
              </main>
              <Footer />
            </>
          }
        />
        <Route
          path="/hotels"
          element={
            <>
              <Navbar />
              <main className="pt-20">
                <Hotels />
              </main>
              <Footer />
            </>
          }
        />
        <Route
          path="/resources"
          element={
            <>
              <Navbar />
              <main className="pt-20">
                <Resources />
              </main>
              <Footer />
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <Navbar />
              <main className="pt-20">
                <Register />
              </main>
              <Footer />
            </>
          }
        />
        <Route
          path="/payment-status"
          element={
            <>
              <Navbar />
              <main className="pt-20">
                <PaymentStatus />
              </main>
              <Footer />
            </>
          }
        />

        {/* ── Admin Routes ─────────────────────────────────────── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="registrations" element={<AdminRegistrations />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="speakers" element={<AdminSpeakers />} />
          <Route path="resources" element={<AdminResources />} />
          <Route path="awards" element={<AdminAwards />} />
          <Route path="schedule" element={<AdminSchedule />} />
          <Route path="hotels" element={<AdminHotels />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* ── 404 ───────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
