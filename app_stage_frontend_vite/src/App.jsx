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
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" />;

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
          <Route path="/produits" element={<ProtectedRoute><Produits /></ProtectedRoute>} />
          <Route path="/sites" element={<ProtectedRoute allowedRoles={['admin', 'employe', 'employé']}><Sites /></ProtectedRoute>} />
          <Route path="/fournisseurs" element={<ProtectedRoute allowedRoles={['admin', 'employe', 'employé']}><Fournisseurs /></ProtectedRoute>} />
          <Route path="/commandes" element={<ProtectedRoute><Commandes /></ProtectedRoute>} />
          <Route path="/transferts" element={<ProtectedRoute><Transferts /></ProtectedRoute>} />
          <Route path="/installations" element={<ProtectedRoute><Installations /></ProtectedRoute>} />
          <Route path="/utilisateurs" element={<ProtectedRoute allowedRoles={['admin']}><Utilisateurs /></ProtectedRoute>} />
          <Route path="/historique" element={<ProtectedRoute allowedRoles={['admin', 'employe', 'employé']}><Historique /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
