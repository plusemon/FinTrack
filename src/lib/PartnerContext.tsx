import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PartnerRelationship } from "../types";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

interface PartnerContextType {
  myPartners: PartnerRelationship[];
  sharedWithMe: PartnerRelationship[];
  loading: boolean;
  activeOwnerId: string | null;
  activeOwnerName: string | null;
  activePermission: PartnerRelationship["permission"] | null;
  switchToOwner: (ownerId: string | null) => void;
  sendInvite: (email: string) => Promise<void>;
  acceptInvite: (ownerId: string) => Promise<void>;
  declineInvite: (ownerId: string) => Promise<void>;
  revokeAccess: (partnerId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextType | undefined>(undefined);

export const usePartner = () => {
  const ctx = useContext(PartnerContext);
  if (!ctx) throw new Error("usePartner must be used within PartnerProvider");
  return ctx;
};

export const PartnerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [myPartners, setMyPartners] = useState<PartnerRelationship[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<PartnerRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setMyPartners([]);
      setSharedWithMe([]);
      return;
    }
    setLoading(true);
    try {
      const [partners, shared] = await Promise.all([
        api.getMyPartners(),
        api.getSharedWithMe(),
      ]);
      setMyPartners(partners);
      setSharedWithMe(shared);
    } catch (error) {
      console.error("Failed to load partner data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const switchToOwner = useCallback((ownerId: string | null) => {
    if (!ownerId) {
      api.setViewContext(null);
      setActiveOwnerId(null);
      return;
    }
    const rel = sharedWithMe.find((s) => s.ownerId === ownerId && s.status === "accepted");
    if (!rel) return;
    api.setViewContext(ownerId, rel.permission);
    setActiveOwnerId(ownerId);
  }, [sharedWithMe]);

  useEffect(() => {
    api.setViewContext(null);
    setActiveOwnerId(null);
    load();
  }, [user, load]);

  useEffect(() => {
    if (activeOwnerId && !sharedWithMe.some((s) => s.ownerId === activeOwnerId && s.status === "accepted")) {
      switchToOwner(null);
    }
  }, [activeOwnerId, sharedWithMe, switchToOwner]);

  const activeRelationship = activeOwnerId
    ? sharedWithMe.find((s) => s.ownerId === activeOwnerId && s.status === "accepted")
    : null;

  const sendInvite = useCallback(async (email: string) => {
    await api.sendPartnerInvite(email);
    await load();
  }, [load]);

  const acceptInvite = useCallback(async (ownerId: string) => {
    await api.acceptPartnerInvite(ownerId);
    await load();
  }, [load]);

  const declineInvite = useCallback(async (ownerId: string) => {
    await api.declinePartnerInvite(ownerId);
    await load();
  }, [load]);

  const revokeAccess = useCallback(async (partnerId: string) => {
    await api.revokePartnerAccess(partnerId);
    await load();
  }, [load]);

  const activeOwnerName = activeRelationship?.ownerName || activeRelationship?.ownerEmail || null;
  const activePermission = activeRelationship?.permission || null;

  return (
    <PartnerContext.Provider
      value={{
        myPartners,
        sharedWithMe,
        loading,
        activeOwnerId,
        activeOwnerName,
        activePermission,
        switchToOwner,
        sendInvite,
        acceptInvite,
        declineInvite,
        revokeAccess,
        refresh: load,
      }}
    >
      {children}
    </PartnerContext.Provider>
  );
};
