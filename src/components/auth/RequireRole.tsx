import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { homeForRole, usePlatform, type SessionRole } from '../../contexts/PlatformContext';

export function RequireRole({ role }: { role: SessionRole }) {
  const { session, sessionLoading } = usePlatform();

  if (sessionLoading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (session.role !== role) return <Navigate to={homeForRole(session.role)} replace />;

  return <Outlet />;
}
