import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireRole } from '@/features/auth/components/RequireRole';
import { useAuth } from '@/features/auth/AuthProvider';
import { homePathFor } from '@/features/auth/permissions';
import Login from '@/features/auth/components/Login';
import PatientLayout from '@/components/PatientLayout';
import PatientHome from '@/features/home/components/PatientHome';
import DiseaseScreen from '@/features/maladie/components/DiseaseScreen';
import MedicationsScreen from '@/features/medicaments/components/MedicationsScreen';
import NutritionScreen from '@/features/alimentation/components/NutritionScreen';
import TipsScreen from '@/features/conseils/components/TipsScreen';
import CommunityScreen from '@/features/communaute/components/CommunityScreen';
import JournalScreen from '@/features/journal/components/JournalScreen';
import CalendarScreen from '@/features/calendrier/components/CalendarScreen';
import Settings from '@/features/settings/components/Settings';
import ProDashboard from '@/features/professional/components/ProDashboard';
import PatientRecord from '@/features/professional/components/PatientRecord';

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
          <Route path="disease" element={<DiseaseScreen />} />
          <Route path="meds" element={<MedicationsScreen />} />
          <Route path="recipes" element={<NutritionScreen />} />
          <Route path="tips" element={<TipsScreen />} />
          <Route path="community" element={<CommunityScreen />} />
          <Route path="journal" element={<JournalScreen />} />
          <Route path="calendar" element={<CalendarScreen />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* ----- Espace médecin ----- */}
      <Route element={<RequireRole roles={['doctor']} />}>
        <Route path="/doctor" element={<ProDashboard />} />
        <Route path="/doctor/patients/:id" element={<PatientRecord />} />
        <Route path="/doctor/settings" element={<Settings />} />
      </Route>

      {/* ----- Espace infirmier ----- */}
      <Route element={<RequireRole roles={['nurse']} />}>
        <Route path="/nurse" element={<ProDashboard />} />
        <Route path="/nurse/patients/:id" element={<PatientRecord />} />
        <Route path="/nurse/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
