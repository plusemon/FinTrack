import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  BellOff,
  UserPlus,
  UserCheck,
  UserX,
  AlertCircle,
  Clock,
  Trash2,
  CheckCheck,
  X,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useNotifications } from "../../lib/NotificationContext";
import { AppNotification, NotificationType } from "../../types";
import { translations, Language } from "../../i18n/translations";
import { cn } from "../../lib/utils";

interface NotificationBellProps {
  language: Language;
  theme: "light" | "dark";
}

const icons: Record<NotificationType, React.ElementType> = {
  partner_invite: UserPlus,
  partner_accept: UserCheck,
  partner_revoke: UserX,
  budget_warning: AlertCircle,
  budget_exceeded: AlertCircle,
  daily_reminder: Clock,
};

const iconColors: Record<NotificationType, string> = {
  partner_invite: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
  partner_accept: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20",
  partner_revoke: "text-red-500 bg-red-50 dark:bg-red-900/20",
  budget_warning: "text-amber-500 bg-amber-50 dark:bg-amber-900/20",
  budget_exceeded: "text-red-500 bg-red-50 dark:bg-red-900/20",
  daily_reminder: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
};

function interpolate(template: string, metadata?: Record<string, unknown>): string {
  if (!metadata) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(metadata[key] ?? ""));
}

export default function NotificationBell({ language, theme }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const ref = useRef<HTMLDivElement>(null);
  const t = translations[language];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    if (isToday(date)) return format(date, "h:mm a");
    if (isYesterday(date)) return t.yesterday || "Yesterday";
    return format(date, "MMM d");
  };

  const renderText = (n: AppNotification) => {
    const title = (t[n.title as keyof typeof t] as string) || n.title;
    const message = (t[n.message as keyof typeof t] as string) || n.message;
    return {
      title: interpolate(title, n.metadata),
      message: interpolate(message, n.metadata),
    };
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "p-2 relative transition-colors rounded-xl",
          theme === "dark" ? "text-zinc-400 hover:text-zinc-200 hover:bg-white/5" : "text-zinc-400 hover:text-zinc-600 hover:bg-black/5"
        )}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white dark:border-zinc-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-xl z-50 overflow-hidden",
              theme === "dark" ? "bg-zinc-900 border-white/10" : "bg-white border-zinc-200"
            )}
          >
            <div className={cn(
              "flex items-center justify-between px-4 py-3 border-b",
              theme === "dark" ? "border-white/10" : "border-zinc-100"
            )}>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{t.notificationCenter || "Notifications"}</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title={t.markAllAsRead || "Mark all as read"}
                  >
                    <CheckCheck size={18} />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center mb-3",
                    theme === "dark" ? "bg-zinc-800 text-zinc-600" : "bg-zinc-100 text-zinc-400"
                  )}>
                    <BellOff size={24} />
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 font-medium">{t.noNotifications || "No notifications yet"}</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = icons[n.type];
                  const { title, message } = renderText(n);
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markAsRead(n.id)}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 border-b cursor-pointer transition-colors group",
                        theme === "dark" ? "border-white/5 hover:bg-white/5" : "border-zinc-100 hover:bg-zinc-50",
                        !n.read && (theme === "dark" ? "bg-emerald-900/10 border-l-4 border-l-emerald-500" : "bg-emerald-50/50 border-l-4 border-l-emerald-500")
                      )}
                    >
                      <div className={cn("p-2 rounded-xl shrink-0", iconColors[n.type])}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{title}</p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{message}</p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{formatDate(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
