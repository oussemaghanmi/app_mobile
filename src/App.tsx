import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useRecoveryDeepLink } from '@/features/auth/useRecoveryDeepLink';
import { useTranslation } from 'react-i18next';
import { RequireRole } from '@/features/auth/components/RequireRole';
import { useAuth } from '@/features/auth/AuthProvider';
import { homePathFor } from '@/features/auth/permissions';
import PatientLayout from '@/components/PatientLayout';

// Chargement différé des écrans par espace et par écran
const Login = lazy(() => import('@/features/auth/components/Login'));
const SignUp = lazy(() => import('@/features/auth/components/SignUp'));
const ForgotPassword = lazy(() => import('@/features/auth/components/ForgotPassword'));
const ResetPassword = lazy(() => import('@/features/auth/components/ResetPassword'));
const PatientHome = lazy(() => import('@/features/home/components/PatientHome'));
const DiseaseScreen = lazy(() => import('@/features/maladie/components/DiseaseScreen'));
const MedicationsScreen = lazy(() => import('@/features/medicaments/components/MedicationsScreen'));
const NutritionScreen = lazy(() => import('@/features/alimentation/components/NutritionScreen'));
const TipsScreen = lazy(() => import('@/features/conseils/components/TipsScreen'));
const CommunityScreen = lazy(() => import('@/features/communaute/components/CommunityScreen'));
const JournalScreen = lazy(() => import('@/features/journal/components/JournalScreen'));
const CalendarScreen = lazy(() => import('@/features/calendrier/components/CalendarScreen'));
const CrohnBotScreen = lazy(() => import('@/features/crohnbot/components/CrohnBotScreen'));
const Settings = lazy(() => import('@/features/settings/components/Settings'));
const ProDashboard = lazy(() => import('@/features/professional/components/ProDashboard'));
const PatientRecord = lazy(() => import('@/features/professional/components/PatientRecord'));

export function ScreenFallback() {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
      className="flex min-h-[50vh] items-center justify-center p-6 text-ink/70"
    >
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-sage/20 border-t-sage"
          aria-hidden="true"
        />
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );
}

function RootRedirect() {
  const { session, profile, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return profile ? <Navigate to={homePathFor(profile.role)} replace /> : null;
}

export default function App() {
  // Lien « Mot de passe oublié » ouvert dans l'APK (#88).
  useRecoveryDeepLink();
  return (
    <Suspense fallback={<ScreenFallback />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ----- Espace patient ----- */}
        <Route element={<RequireRole roles={['patient']} />}>
          <Route path="/patient" element={<PatientLayout />}>
            <Route index element={<PatientHome />} />
            <Route path="disease" element={<DiseaseScreen />} />
            <Route path="meds" element={<MedicationsScreen />} />
            <Route path="recipes" element={<NutritionScreen />} />
            <Route path="tips" element={<TipsScreen />} />
            <Route path="community" element={<CommunityScreen />} />
            <Route path="journal" element={<JournalScreen />} />
            <Route path="calendar" element={<CalendarScreen />} />
            <Route path="assistant" element={<CrohnBotScreen />} />
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
    </Suspense>
  );
}
