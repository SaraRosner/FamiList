import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import FamilySetup from './pages/FamilySetup';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Events from './pages/Events';
import Chat from './pages/Chat';
import FamilyEvents from './pages/FamilyEvents';
import Calendar from './pages/Calendar';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">טוען...</div>;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/" element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="family-setup" element={<FamilySetup />} />
              <Route path="reports" element={<Reports />} />
              <Route path="events" element={<Events />} />
              <Route path="chat" element={<Chat />} />
              <Route path="family-events" element={<FamilyEvents />} />
              <Route path="calendar" element={<Calendar />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

