import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { homePathFor, type Role } from './permissions';

/** Garde de route : redirige vers /login si non connecté, ou vers l'accueil du bon rôle. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const { session, profile, loading } = useAuth();
  if (loading) return <div className="p-6 text-center">…</div>;
  if (!session) return <Navigate to="/login" replace />;
  if (!profile) return <div className="p-6 text-center">…</div>;
  if (!roles.includes(profile.role)) return <Navigate to={homePathFor(profile.role)} replace />;
  return <Outlet />;
}
