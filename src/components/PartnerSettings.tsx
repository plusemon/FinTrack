import React, { useState } from "react";
import { Users, Mail, UserPlus, UserX, Check, X, Loader2 } from "lucide-react";
import { usePartner } from "../lib/PartnerContext";
import { Language, translations } from "../i18n/translations";
import Toast, { ToastType } from "./ui/Toast";

interface PartnerSettingsProps {
  language: Language;
}

export default function PartnerSettings({ language }: PartnerSettingsProps) {
  const t = translations[language];
  const { myPartners, sharedWithMe, loading, sendInvite, acceptInvite, declineInvite, revokeAccess } = usePartner();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSending(true);
    try {
      await sendInvite(email.trim());
      setEmail("");
      setToast({ message: t.invitationSent, type: "success" });
    } catch (error: any) {
      const message = error?.message === "User not found"
        ? t.userNotFound
        : error?.message === "Cannot invite yourself"
        ? t.cannotInviteSelf
        : t.error || "Failed to send invite";
      setToast({ message, type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  const setProcessing = (id: string, value: boolean) => setIsProcessing((prev) => ({ ...prev, [id]: value }));

  const handleAccept = async (ownerId: string) => {
    setProcessing(`accept-${ownerId}`, true);
    try {
      await acceptInvite(ownerId);
      setToast({ message: t.invitationAccepted, type: "success" });
    } catch (error) {
      setToast({ message: t.error || "Failed to accept invite", type: "error" });
    } finally {
      setProcessing(`accept-${ownerId}`, false);
    }
  };

  const handleDecline = async (ownerId: string) => {
    setProcessing(`decline-${ownerId}`, true);
    try {
      await declineInvite(ownerId);
      setToast({ message: t.partnerAccessRevoked, type: "info" });
    } catch (error) {
      setToast({ message: t.error || "Failed to decline invite", type: "error" });
    } finally {
      setProcessing(`decline-${ownerId}`, false);
    }
  };

  const handleRevoke = async (partnerId: string) => {
    setProcessing(`revoke-${partnerId}`, true);
    try {
      await revokeAccess(partnerId);
      setToast({ message: t.partnerAccessRevoked, type: "info" });
    } catch (error) {
      setToast({ message: t.error || "Failed to revoke access", type: "error" });
    } finally {
      setProcessing(`revoke-${partnerId}`, false);
    }
  };

  const statusBadge = (status: string) => {
    const base = "px-2 py-0.5 rounded-full text-xs font-bold";
    if (status === "accepted") return <span className={`${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400`}>{t.invitationAccepted}</span>;
    if (status === "pending") return <span className={`${base} bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400`}>{t.invitationPending}</span>;
    return <span className={`${base} bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400`}>{status}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Invite */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <UserPlus size={20} className="text-emerald-600 dark:text-emerald-400" />
            {t.invitePartner}
          </h3>
        </div>
        <form onSubmit={handleSendInvite} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">{t.partnerEmail}</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.invitePlaceholder}
                className="flex-1 p-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-900 dark:text-zinc-100"
                required
              />
              <button
                type="submit"
                disabled={isSending || !email.trim()}
                className="px-5 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                {t.sendInvite}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Shared with me */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
            {t.sharedWithMe}
          </h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-zinc-400" /></div>
          ) : sharedWithMe.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.noSharedData}</p>
          ) : (
            <ul className="space-y-3">
              {sharedWithMe.map((share) => (
                <li key={share.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <img
                        src={share.ownerPhotoURL || `https://ui-avatars.com/api/?name=${share.ownerName || share.ownerEmail || 'User'}`}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{share.ownerName || share.ownerEmail}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{share.ownerEmail}</p>
                    </div>
                    <div className="ml-2">{statusBadge(share.status)}</div>
                  </div>
                  {share.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAccept(share.ownerId)}
                        disabled={isProcessing[`accept-${share.ownerId}`]}
                        className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        title={t.accept}
                      >
                        {isProcessing[`accept-${share.ownerId}`] ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      </button>
                      <button
                        onClick={() => handleDecline(share.ownerId)}
                        disabled={isProcessing[`decline-${share.ownerId}`]}
                        className="p-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50"
                        title={t.decline}
                      >
                        {isProcessing[`decline-${share.ownerId}`] ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* My partners */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-white/5">
          <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
            {t.myPartners}
          </h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-6"><Loader2 size={24} className="animate-spin text-zinc-400" /></div>
          ) : myPartners.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t.noPartners}</p>
          ) : (
            <ul className="space-y-3">
              {myPartners.map((partner) => (
                <li key={partner.id} className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <img
                        src={partner.partnerPhotoURL || `https://ui-avatars.com/api/?name=${partner.partnerName || partner.partnerEmail || 'User'}`}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100">{partner.partnerName || partner.partnerEmail}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{partner.partnerEmail} · {partner.permission}</p>
                    </div>
                    <div className="ml-2">{statusBadge(partner.status)}</div>
                  </div>
                  {partner.status !== "revoked" && (
                    <button
                      onClick={() => handleRevoke(partner.partnerId)}
                      disabled={isProcessing[`revoke-${partner.partnerId}`]}
                      className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 disabled:opacity-50"
                      title={t.revokeAccess}
                    >
                      {isProcessing[`revoke-${partner.partnerId}`] ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
