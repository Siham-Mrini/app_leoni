import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './components/Dashboard';
import Produits from './components/Produits';
import Sites from './components/Sites';
import Fournisseurs from './components/Fournisseurs';
import Commandes from './components/commandes';
import Transferts from './components/Transferts';
import Installations from './components/Installations';
import Historique from './components/Historique';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import Utilisateurs from './components/Utilisateurs';
import Emplacements from './components/Emplacements';

import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;

  // Admin est redirigé vers /utilisateurs s'il essaie d'accéder à des pages non autorisées
  if (user.role?.toLowerCase() === 'admin') {
    const adminAllowed = ['/utilisateurs', '/profile'];
    const currentPath = window.location.pathname;
    if (!adminAllowed.includes(currentPath)) {
      return <Navigate to="/utilisateurs" />;
    }
  }

  if (allowedRoles && !allowedRoles.some(role => role.toLowerCase() === user.role?.toLowerCase())) {
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<ProtectedRoute allowedRoles={['admin']}><Register /></ProtectedRoute>} />

          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/produits" element={<ProtectedRoute allowedRoles={['manager', 'employe', 'employé']}><Produits /></ProtectedRoute>} />
          <Route path="/sites" element={<ProtectedRoute allowedRoles={['manager', 'employe', 'employé']}><Sites /></ProtectedRoute>} />
          <Route path="/fournisseurs" element={<ProtectedRoute allowedRoles={['manager', 'employe', 'employé']}><Fournisseurs /></ProtectedRoute>} />
          <Route path="/commandes" element={<ProtectedRoute allowedRoles={['manager', 'employe', 'employé']}><Commandes /></ProtectedRoute>} />
          <Route path="/transferts" element={<ProtectedRoute allowedRoles={['manager', 'employe', 'employé']}><Transferts /></ProtectedRoute>} />
          <Route path="/emplacements" element={<ProtectedRoute allowedRoles={['manager', 'employe', 'employé']}><Emplacements /></ProtectedRoute>} />
          <Route path="/installations" element={<ProtectedRoute allowedRoles={['manager', 'employe', 'employé']}><Installations /></ProtectedRoute>} />
          <Route path="/utilisateurs" element={<ProtectedRoute allowedRoles={['admin']}><Utilisateurs /></ProtectedRoute>} />
          <Route path="/historique" element={<ProtectedRoute allowedRoles={['manager', 'employe', 'employé']}><Historique /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
