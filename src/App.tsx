import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from './pages/Login';
import Appointments from './pages/Appointments';
import Clients from './pages/Clients';
import ClientProfile from './pages/ClientProfile';
import SlotAdmin from './pages/SlotsAdmin';
import Dashboard from './pages/Dashboard';
import CalendarBookings from './pages/CalendarBookings';
import Layout from './components/Layout';
import MyProfile from './pages/MyProfile';
import ManagerCRM from './pages/managerCRM'; // ADD THIS

const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch (e) {
    return true;
  }
};

const App: React.FC = () => {
  const rawToken = localStorage.getItem('token');
  const token = rawToken && !isTokenExpired(rawToken) ? rawToken : null;

  useEffect(() => {
    if (rawToken && isTokenExpired(rawToken)) {
      localStorage.removeItem('token');
      localStorage.removeItem('client');
    }
  }, [rawToken]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {token && (
          <Route element={<Layout />}>
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/calendar" element={<CalendarBookings />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/client/:id" element={<ClientProfile />} />
            <Route path="/admin/slots" element={<SlotAdmin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/manager-crm" element={<ManagerCRM />} /> {/* <--- ADD THIS */}
          </Route>
        )}
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default App;
