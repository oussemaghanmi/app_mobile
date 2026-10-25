import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from '@/features/auth/components/RequireRole';
import { useAuth } from '@/features/auth/AuthProvider';
import { homePathFor } from '@/features/auth/permissions';
import Login from '@/features/auth/components/Login';
import PatientLayout from '@/components/PatientLayout';
import PatientHome from '@/features/home/components/PatientHome';
import Placeholder from '@/components/Placeholder';
import Settings from '@/features/settings/components/Settings';
import ProDashboard from '@/features/professional/components/ProDashboard';

function RootRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return profile ? <Navigate to={homePathFor(profile.role)} replace /> : null;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      {/* ----- Espace patient ----- */}
      <Route element={<RequireRole roles={['patient']} />}>
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<PatientHome />} />
          {/* Écrans à migrer depuis le prototype Figma (voir src/figma/README.md) */}
          <Route path="disease" element={<Placeholder titleKey="sections.disease" />} />
          <Route path="meds" element={<Placeholder titleKey="sections.meds" />} />
          <Route path="recipes" element={<Placeholder titleKey="sections.recipes" />} />
          <Route path="tips" element={<Placeholder titleKey="sections.tips" />} />
          <Route path="community" element={<Placeholder titleKey="sections.community" />} />
          <Route path="journal" element={<Placeholder titleKey="sections.journal" />} />
          <Route path="calendar" element={<Placeholder titleKey="sections.calendar" />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* ----- Espace médecin ----- */}
      <Route element={<RequireRole roles={['doctor']} />}>
        <Route path="/doctor" element={<ProDashboard />} />
        <Route path="/doctor/settings" element={<Settings />} />
      </Route>

      {/* ----- Espace infirmier ----- */}
      <Route element={<RequireRole roles={['nurse']} />}>
        <Route path="/nurse" element={<ProDashboard />} />
        <Route path="/nurse/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
