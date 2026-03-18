import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import PlaceholderPage from './pages/PlaceholderPage';

// Simple wrappers for the placeholder pages
const Internaciones = () => <PlaceholderPage title="Internaciones" />;
const Guardia = () => <PlaceholderPage title="Guardia" />;
const Agenda = () => <PlaceholderPage title="Agenda" />;

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/internaciones" element={<Internaciones />} />
              <Route path="/guardia" element={<Guardia />} />
              <Route path="/agenda" element={<Agenda />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
