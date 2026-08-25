import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { featuredEditionId } from '../data/editions';
export type SessionRole = 'admin' | 'empresa';
export interface Session {
  role: SessionRole;
  name: string;
  email: string;
  companyId?: string;
}
interface PlatformContextValue {
  session: Session | null;
  sessionLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => void;
  activeEditionId: string;
  setActiveEditionId: (id: string) => void;
  bannerCollapsed: boolean;
  setBannerCollapsed: (collapsed: boolean) => void;
}
const PlatformContext = createContext<PlatformContextValue | null>(null);
const COLLAPSE_KEY = 'emlatam-banner-collapsed';
export function PlatformProvider({
  children


}: {children: React.ReactNode;}) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeEditionId, setActiveEditionId] = useState(featuredEditionId);
  const [bannerCollapsed, setCollapsedState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === '1';
  });
  const setBannerCollapsed = useCallback((collapsed: boolean) => {
    setCollapsedState(collapsed);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    }
  }, []);

  const loadSessionFromUser = useCallback(async (userId: string, email: string | undefined) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, company_id, full_name')
      .eq('id', userId)
      .single();
    if (error || !profile) {
      setSession(null);
      return;
    }
    setSession({
      role: profile.role,
      name: profile.full_name || email || '',
      email: email ?? '',
      companyId: profile.company_id ?? undefined
    });
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const user = data.session?.user;
      if (user) {
        loadSessionFromUser(user.id, user.email).finally(() => {
          if (active) setSessionLoading(false);
        });
      } else {
        setSession(null);
        setSessionLoading(false);
      }
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, authSession) => {
      const user = authSession?.user;
      if (user) {
        loadSessionFromUser(user.id, user.email);
      } else {
        setSession(null);
      }
    });
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadSessionFromUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(() => {
    supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo<PlatformContextValue>(() => ({
    session,
    sessionLoading,
    signIn,
    signOut,
    activeEditionId,
    setActiveEditionId,
    bannerCollapsed,
    setBannerCollapsed
  }), [session, sessionLoading, signIn, signOut, activeEditionId, bannerCollapsed, setBannerCollapsed]);
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}
export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);
  if (!context) throw new Error('usePlatform debe usarse dentro de PlatformProvider');
  return context;
}
