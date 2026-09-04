"use client"

import { useSyncExternalStore } from "react"

// Matches Tailwind's `md` breakpoint (768px) used throughout the app's
// responsive layout, so "mobile" here means the same thing everywhere.
const MOBILE_QUERY = "(max-width: 767px)"

function subscribe(callback: () => void) {
    const mql = window.matchMedia(MOBILE_QUERY)
    mql.addEventListener("change", callback)
    return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
    return window.matchMedia(MOBILE_QUERY).matches
}

function getServerSnapshot() {
    return false
}

export function useIsMobile(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
