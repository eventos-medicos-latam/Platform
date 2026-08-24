import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePlatform, type SessionRole } from '../../contexts/PlatformContext';

const homeByRole: Record<SessionRole, string> = {
  admin: '/admin',
  empresa: '/portal'
};

export function RequireRole({ role }: { role: SessionRole }) {
  const { session, sessionLoading } = usePlatform();

  if (sessionLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={homeByRole[session.role]} replace />;

  return <Outlet />;
}
