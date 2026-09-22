import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/AuthContext';
import Events from './pages/Events';
import Home from './pages/Home';
import EventDetail from './pages/EventDetail';
import Clubs, { ClubDetail } from './pages/Clubs';
import Auth from './pages/Auth';
import StudentOverview from './pages/StudentOverview';
import MyRegistrations from './pages/MyRegistrations';
import RegistrationDetail from './pages/RegistrationDetail';
import RequireStudent from './features/student/RequireStudent';
import Layout from './components/layout/Layout';
import './components/student/student.css';

import RequireOrganizer from './features/organizer/RequireOrganizer';
import OrganizerLayout from './components/organizer/OrganizerLayout';
import OrganizerOverview from './pages/organizer/OrganizerOverview';
import OrganizerEvents from './pages/organizer/OrganizerEvents';
import OrganizerEventDetail from './pages/organizer/OrganizerEventDetail';
import CreateEvent from './pages/organizer/CreateEvent';
import EditEvent from './pages/organizer/EditEvent';
import Participants from './pages/organizer/Participants';
import CheckIn from './pages/organizer/CheckIn';
import GalleryManager from './pages/organizer/GalleryManager';
import './components/organizer/organizer.css';

import RequireAdmin from './features/admin/RequireAdmin';
import AdminLayout from './components/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminEvents from './pages/admin/AdminEvents';
import AdminEventReview from './pages/admin/AdminEventReview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminClubs from './pages/admin/AdminClubs';
import AdminVenues from './pages/admin/AdminVenues';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminStatistics from './pages/admin/AdminStatistics';
import './components/admin/admin.css';

import { useSmoothScroll } from './lib/useSmoothScroll';
import 'lenis/dist/lenis.css';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } });

export default function App() {
  useSmoothScroll();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/:slug" element={<EventDetail />} />
              <Route path="/clubs" element={<Clubs />} />
              <Route path="/clubs/:slug" element={<ClubDetail />} />
              <Route path="/student" element={<RequireStudent><StudentOverview /></RequireStudent>} />
              <Route path="/student/registrations" element={<RequireStudent><MyRegistrations /></RequireStudent>} />
              <Route path="/student/registrations/:id" element={<RequireStudent><RegistrationDetail /></RequireStudent>} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/register" element={<Auth mode="register" />} />

              {/* Phase 8 — Organizer Console */}
              <Route
                path="/organizer"
                element={
                  <RequireOrganizer>
                    <OrganizerLayout />
                  </RequireOrganizer>
                }
              >
                <Route index element={<OrganizerOverview />} />
                <Route path="events" element={<OrganizerEvents />} />
                <Route path="events/new" element={<CreateEvent />} />
                <Route path="events/:slug" element={<OrganizerEventDetail />} />
                <Route path="events/:slug/edit" element={<EditEvent />} />
                <Route path="events/:slug/participants" element={<Participants />} />
                <Route path="events/:slug/check-in" element={<CheckIn />} />
                <Route path="events/:slug/gallery" element={<GalleryManager />} />
              </Route>

              {/* Phase 9 — Admin Control Center */}
              <Route
                path="/admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/:slug" element={<AdminEventReview />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="clubs" element={<AdminClubs />} />
                <Route path="venues" element={<AdminVenues />} />
                <Route path="registrations" element={<AdminRegistrations />} />
                <Route path="statistics" element={<AdminStatistics />} />
              </Route>

              <Route
                path="*"
                element={
                  <div className="container page">
                    <h1>Off the map.</h1>
                    <p>This page doesn’t exist. Use Events or Clubs above to find your way back.</p>
                  </div>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
