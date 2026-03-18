import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PlaceholderPage from './pages/PlaceholderPage';

// Simple wrappers for the placeholder pages
const Internaciones = () => <PlaceholderPage title="Internaciones" />;
const Guardia = () => <PlaceholderPage title="Guardia" />;
const Agenda = () => <PlaceholderPage title="Agenda" />;

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/internaciones" element={<Internaciones />} />
        <Route path="/guardia" element={<Guardia />} />
        <Route path="/agenda" element={<Agenda />} />
      </Routes>
    </Layout>
  );
}

export default App;
