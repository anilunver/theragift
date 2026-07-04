import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Layout from './components/Layout.jsx'

import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Clients from './pages/Clients.jsx'
import ClientDetail from './pages/ClientDetail.jsx'
import Calendar from './pages/Calendar.jsx'
import AppointmentNew from './pages/AppointmentNew.jsx'
import Suggestions from './pages/Suggestions.jsx'
import Payments from './pages/Payments.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'
import PublicFormPage from './pages/PublicFormPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/public/forms/:token" element={<PublicFormPage />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientDetail />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/appointments/new" element={<AppointmentNew />} />
                <Route path="/suggestions" element={<Suggestions />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
       