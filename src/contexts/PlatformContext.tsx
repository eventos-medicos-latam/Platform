import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import type { BannerSlot, Registration, SponsorBannerConfig } from '../types/commerce';
import { sponsorBanner } from '../data/sponsors';
import { registrations as seedRegistrations } from '../data/registrations';
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
  banner: SponsorBannerConfig;
  updateBanner: (patch: Partial<SponsorBannerConfig>) => void;
  updateSlot: (slotId: string, patch: Partial<BannerSlot>) => void;
  moveSlot: (slotId: string, direction: -1 | 1) => void;
  registrations: Registration[];
  addRegistration: (registration: Registration) => void;
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
  const [banner, setBanner] = useState<SponsorBannerConfig>(sponsorBanner);
  const [registrations, setRegistrations] = useState<Registration[]>(seedRegistrations);
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
  const updateBanner = useCallback((patch: Partial<SponsorBannerConfig>) => {
    setBanner((current) => ({
      ...current,
      ...patch
    }));
  }, []);
  const updateSlot = useCallback((slotId: string, patch: Partial<BannerSlot>) => {
    setBanner((current) => ({
      ...current,
      slots: current.slots.map((slot) => slot.id === slotId ? {
        ...slot,
        ...patch
      } : slot)
    }));
  }, []);
  const moveSlot = useCallback((slotId: string, direction: -1 | 1) => {
    setBanner((current) => {
      const ordered = [...current.slots].sort((a, b) => a.order - b.order);
      const index = ordered.findIndex((slot) => slot.id === slotId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return current;
      const next = [...ordered];
      [next[index], next[target]] = [next[target], next[index]];
      return {
        ...current,
        slots: next.map((slot, position) => ({
          ...slot,
          order: position + 1
        }))
      };
    });
  }, []);
  const addRegistration = useCallback((registration: Registration) => {
    setRegistrations((current) => [registration, ...current]);
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
    banner,
    updateBanner,
    updateSlot,
    moveSlot,
    registrations,
    addRegistration,
    bannerCollapsed,
    setBannerCollapsed
  }), [session, sessionLoading, signIn, signOut, activeEditionId, banner, updateBanner, updateSlot, moveSlot, registrations, addRegistration, bannerCollapsed, setBannerCollapsed]);
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}
export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);
  if (!context) throw new Error('usePlatform debe usarse dentro de PlatformProvider');
  return context;
}