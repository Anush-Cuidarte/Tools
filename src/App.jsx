import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import ToolGuard from './components/ToolGuard';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Planes from './pages/Planes';
import SuscripcionResultado from './pages/SuscripcionResultado';
import MiSuscripcion from './pages/MiSuscripcion';
import GastricCapacity from './pages/GastricCapacity';
import GrowthCharts from './pages/GrowthCharts';
import NippleLesion from './pages/NippleLesion';

function App() {
  return (
    <Layout>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Suscripciones */}
        <Route path="/planes" element={<ToolGuard><Planes /></ToolGuard>} />
        <Route path="/suscripcion/:tipo" element={<SuscripcionResultado />} />
        <Route path="/mi-suscripcion" element={<AuthGuard><MiSuscripcion /></AuthGuard>} />

        {/* Tools (demo-friendly) */}
        <Route path="/" element={<ToolGuard><Home /></ToolGuard>} />
        <Route path="/gastric-capacity" element={<ToolGuard><GastricCapacity /></ToolGuard>} />
        <Route path="/growth-charts" element={<ToolGuard><GrowthCharts /></ToolGuard>} />
        <Route path="/nipple-lesion" element={<ToolGuard><NippleLesion /></ToolGuard>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
