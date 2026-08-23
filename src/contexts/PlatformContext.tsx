import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
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
  signIn: (session: Session) => void;
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
  const value = useMemo<PlatformContextValue>(() => ({
    session,
    signIn: setSession,
    signOut: () => setSession(null),
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
  }), [session, activeEditionId, banner, updateBanner, updateSlot, moveSlot, registrations, addRegistration, bannerCollapsed, setBannerCollapsed]);
  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}
export function usePlatform(): PlatformContextValue {
  const context = useContext(PlatformContext);
  if (!context) throw new Error('usePlatform debe usarse dentro de PlatformProvider');
  return context;
}