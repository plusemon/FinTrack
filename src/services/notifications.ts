export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return Promise.resolve("denied" as NotificationPermission);
  }
  return Notification.requestPermission();
}

export function msUntilNext(time: string, now: Date = new Date()): number {
  const [hours, minutes] = time.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime() - now.getTime();
}

export function scheduleDailyReminder(
  enabled: boolean,
  time: string,
  callback: () => void
): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const clear = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  if (!enabled || !time) {
    return clear;
  }

  const delay = msUntilNext(time);
  timeoutId = setTimeout(() => {
    callback();
    intervalId = setInterval(callback, 24 * 60 * 60 * 1000);
  }, delay);

  return clear;
}

export function shouldNotifyBudget(settings: { budgetAlertsEnabled?: boolean }): boolean {
  return settings.budgetAlertsEnabled !== false;
}
