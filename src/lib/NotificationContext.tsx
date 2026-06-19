import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import { AppNotification, NotificationType } from "../types";
import { api } from "../services/api";
import { translations } from "../i18n/translations";
import Toast, { ToastType } from "../components/ui/Toast";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string, read?: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  notify: (type: NotificationType, title: string, message: string, metadata?: Record<string, unknown>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

function interpolate(template: string, metadata?: Record<string, unknown>): string {
  if (!metadata) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(metadata[key] ?? ""));
}

function resolveToastText(notification: AppNotification): string {
  const en = translations.en;
  const title = (en[notification.title as keyof typeof en] as string) || notification.title;
  return interpolate(title, notification.metadata);
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const isInitialRef = useRef(true);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const getTypeToast = (type: NotificationType): ToastType => {
    switch (type) {
      case "budget_exceeded":
      case "partner_revoke":
        return "error";
      case "budget_warning":
        return "warning";
      case "partner_invite":
      case "partner_accept":
      case "daily_reminder":
      default:
        return "info";
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      isInitialRef.current = true;
      return;
    }

    const q = query(
      collection(db, `users/${user.uid}/notifications`),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AppNotification));
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.read).length);

      if (!isInitialRef.current) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "added") {
            const data = change.doc.data() as AppNotification;
            showToast(resolveToastText(data), getTypeToast(data.type));
          }
        });
      } else {
        isInitialRef.current = false;
      }
    });

    return () => {
      unsubscribe();
      isInitialRef.current = true;
    };
  }, [user, showToast]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const items = await api.getNotifications();
    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.read).length);
  }, [user]);

  const markAsRead = useCallback(async (id: string, read: boolean = true) => {
    await api.markNotificationRead(id, read);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev + (read ? -1 : 1)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    await api.deleteNotification(id);
    setNotifications((prev) => {
      const removed = prev.find((n) => n.id === id);
      const next = prev.filter((n) => n.id !== id);
      if (removed && !removed.read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      return next;
    });
  }, []);

  const notify = useCallback(async (
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!user) return;
    await api.createNotification({
      userId: user.uid,
      type,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString(),
      metadata,
    });
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh,
        notify,
      }}
    >
      {children}
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
        />
      ))}
    </NotificationContext.Provider>
  );
};
