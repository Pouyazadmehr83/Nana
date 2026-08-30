import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage       from './pages/HomePage';
import PetDetailPage  from './pages/PetDetailPage';
import CreatePetPage  from './pages/CreatePetPage';
import EditPetPage    from './pages/EditPetPage';
import MyReportsPage  from './pages/MyReportsPage';
import MapPage        from './pages/MapPage';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return (
    <div className="loading-center" style={{ minHeight: '60vh' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/pets/:id"   element={<PetDetailPage />} />
          <Route path="/map"        element={<MapPage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />
          <Route path="/create"     element={<ProtectedRoute><CreatePetPage /></ProtectedRoute>} />
          <Route path="/edit/:id"   element={<ProtectedRoute><EditPetPage /></ProtectedRoute>} />
          <Route path="/my-reports" element={<ProtectedRoute><MyReportsPage /></ProtectedRoute>} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
