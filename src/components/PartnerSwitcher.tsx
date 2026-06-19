import React, { useEffect, useRef, useState } from "react";
import { Users, Check, ChevronDown, User } from "lucide-react";
import { usePartner } from "../lib/PartnerContext";
import { Language, translations } from "../i18n/translations";
import { cn } from "../lib/utils";

interface PartnerSwitcherProps {
  language: Language;
  theme: "light" | "dark";
}

export default function PartnerSwitcher({ language, theme }: PartnerSwitcherProps) {
  const t = translations[language];
  const { sharedWithMe, activeOwnerId, activeOwnerName, switchToOwner } = usePartner();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const accepted = sharedWithMe.filter((s) => s.status === "accepted");

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (ownerId: string | null) => {
    switchToOwner(ownerId);
    setOpen(false);
  };

  const label = activeOwnerName
    ? t.viewingPartnerData.replace("{{name}}", activeOwnerName)
    : t.switchAccount;

  if (accepted.length === 0 && !activeOwnerId) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold transition-colors",
          theme === "dark"
            ? "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
            : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
        )}
      >
        <Users size={16} />
        <span className="max-w-[120px] sm:max-w-[180px] truncate">{label}</span>
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-56 rounded-xl border shadow-lg z-50 overflow-hidden",
            theme === "dark" ? "bg-zinc-900 border-white/10" : "bg-white border-zinc-200"
          )}
        >
          <button
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors",
              theme === "dark" ? "hover:bg-zinc-800 text-zinc-200" : "hover:bg-zinc-50 text-zinc-800",
              !activeOwnerId && (theme === "dark" ? "bg-zinc-800/50" : "bg-zinc-50")
            )}
          >
            <span className="flex items-center gap-2">
              <User size={16} /> {t.switchToMyData}
            </span>
            {!activeOwnerId && <Check size={16} className="text-emerald-500" />}
          </button>

          {accepted.map((share) => (
            <button
              key={share.ownerId}
              onClick={() => handleSelect(share.ownerId)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors border-t",
                theme === "dark"
                  ? "hover:bg-zinc-800 text-zinc-200 border-white/5"
                  : "hover:bg-zinc-50 text-zinc-800 border-zinc-100",
                activeOwnerId === share.ownerId && (theme === "dark" ? "bg-zinc-800/50" : "bg-zinc-50")
              )}
            >
              <span className="flex items-center gap-2 truncate">
                <img
                  src={share.ownerPhotoURL || `https://ui-avatars.com/api/?name=${share.ownerName || share.ownerEmail || 'User'}`}
                  alt=""
                  className="w-5 h-5 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="truncate">{share.ownerName || share.ownerEmail}</span>
              </span>
              {activeOwnerId === share.ownerId && <Check size={16} className="text-emerald-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
