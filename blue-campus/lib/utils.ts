import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** Formats an ISO date string ("2026-09-03") as "03. Sep." */
export function formatDate(date: string): string {
  const [, month, day] = date.split("-")
  const monthName = MONTHS[Number(month) - 1]
  return monthName ? `${day}. ${monthName}.` : date
}
