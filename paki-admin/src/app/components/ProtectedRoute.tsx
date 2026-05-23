'use client';

import { Navigate } from '../lib/router';
import { useAuth } from '../contexts/AuthContext';
import type { AccountRole } from '../lib/sampleAccounts';

interface ProtectedRouteProps {
  children: React.ReactNode;
  app: 'pakiship' | 'pakipark' | 'pakiadmin';
  requiredRole?: AccountRole;
}

function canAccessApp(
  userApp: 'pakiship' | 'pakipark' | 'pakiadmin',
  requestedApp: 'pakiship' | 'pakipark' | 'pakiadmin'
) {
  if (userApp === requestedApp) {
    return true;
  }

  if (userApp === 'pakiadmin') {
    return true;
  }

  const sharedOperationsApps = new Set(['pakiship', 'pakipark']);

  return sharedOperationsApps.has(userApp) && sharedOperationsApps.has(requestedApp);
}

export function ProtectedRoute({ children, app, requiredRole }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user || !canAccessApp(user.app, app)) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/pakiadmin/dashboard" replace />;
  }

  return <>{children}</>;
}
