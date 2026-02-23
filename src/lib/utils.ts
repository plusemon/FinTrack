import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencyCode: string = "USD") {
  return new Intl.NumberFormat(currencyCode === "BDT" ? "en-BD" : "en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: currencyCode === "BDT" ? 0 : 2,
  }).format(amount);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
