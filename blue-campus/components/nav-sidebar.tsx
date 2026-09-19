"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    CalendarDays,
    BookOpen,
    ClipboardList,
    Receipt,
    Users,
    Anchor,
    GraduationCap,
    Building2,
    TrendingUp,
    LogOut,
    Menu,
    Eye,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { signOut } from "@/app/login/actions"
import { setActiveSchool } from "@/app/schools/actions"
import type { Role } from "@/lib/auth/current-profile"

const NAV_ITEMS = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/lessons", label: "Lessons", icon: CalendarDays },
    { href: "/courses", label: "Courses", icon: BookOpen },
    { href: "/registrations", label: "Registrations", icon: ClipboardList },
    { href: "/transactions", label: "Transactions", icon: Receipt },
    { href: "/instructors", label: "Instructors", icon: Users },
    { href: "/boats", label: "Boats", icon: Anchor },
    { href: "/students", label: "Students", icon: GraduationCap },
    { href: "/schools", label: "Schools", icon: Building2 },
    { href: "/performance", label: "Performance", icon: TrendingUp },
]

// Students get a single, heavily-restricted dashboard for now — no
// self-service booking yet, so the rest of the app's management nav
// doesn't apply to them.
function getNavItems(role: Role | null) {
    if (role === "student") {
        return NAV_ITEMS.filter((item) => item.href === "/")
    }
    return NAV_ITEMS.filter((item) => item.href !== "/schools" || role === "admin")
}

type Props = {
    userEmail: string | null
    role: Role | null
    activeSchool: { id: number; name: string } | null
}

function BrandMark() {
    return (
        <div className="flex items-center gap-2 border-b border-sidebar-border px-4 py-5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Anchor className="size-4" />
            </div>
            <span className="font-heading text-sm font-semibold tracking-wide">Blue Campus</span>
        </div>
    )
}

function NavLinks({
    pathname,
    navItems,
    onNavigate,
}: {
    pathname: string
    navItems: typeof NAV_ITEMS
    onNavigate?: () => void
}) {
    return (
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
            {navItems.map(({ href, label, icon: Icon }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)

                return (
                    <Link
                        key={href}
                        href={href}
                        onClick={onNavigate}
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                    >
                        <Icon className="size-4" />
                        {label}
                    </Link>
                )
            })}
        </nav>
    )
}

function ActiveSchoolBlock({ activeSchool }: { activeSchool: { id: number; name: string } | null }) {
    const [isPending, startTransition] = useTransition()

    if (!activeSchool) return null

    function clearActiveSchool() {
        startTransition(() => {
            setActiveSchool(new FormData())
        })
    }

    return (
        <div className="flex flex-col gap-1.5 border-b border-sidebar-border bg-primary/10 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-sidebar-foreground">
                <Eye className="size-3.5" />
                Viewing: {activeSchool.name}
            </div>
            <button
                type="button"
                onClick={clearActiveSchool}
                disabled={isPending}
                className="text-left text-xs text-primary underline-offset-2 hover:underline"
            >
                View all schools
            </button>
        </div>
    )
}

function SignOutBlock({ userEmail }: { userEmail: string | null }) {
    if (!userEmail) return null

    return (
        <div className="flex flex-col gap-2 border-t border-sidebar-border px-4 py-3">
            <span className="truncate text-xs text-sidebar-foreground/60">{userEmail}</span>
            <form action={signOut}>
                <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    <LogOut className="size-4" />
                    Sign out
                </Button>
            </form>
        </div>
    )
}

export default function NavSidebar({ userEmail, role, activeSchool }: Props) {
    const pathname = usePathname()
    const [open, setOpen] = useState(false)
    const navItems = getNavItems(role)

    if (pathname === "/login") return null

    return (
        <>
            {/* Mobile top bar */}
            <div className="flex items-center justify-between gap-2 border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
                <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <Anchor className="size-4" />
                    </div>
                    <Link href="/" className="font-heading text-sm font-semibold tracking-wide">
                        Blue Campus
                    </Link>
                </div>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => setOpen(true)}
                >
                    <Menu className="size-5" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </div>

            {/* Mobile drawer */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent side="left" className="gap-0 bg-sidebar p-0 text-sidebar-foreground data-[side=left]:w-64">
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <div className="flex h-full flex-col">
                        <BrandMark />
                        <ActiveSchoolBlock activeSchool={activeSchool} />
                        <NavLinks pathname={pathname} navItems={navItems} onNavigate={() => setOpen(false)} />
                        <SignOutBlock userEmail={userEmail} />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Desktop sidebar */}
            <aside className="hidden h-full w-56 flex-none flex-col bg-sidebar text-sidebar-foreground md:flex">
                <BrandMark />
                <ActiveSchoolBlock activeSchool={activeSchool} />
                <NavLinks pathname={pathname} navItems={navItems} />
                <SignOutBlock userEmail={userEmail} />
            </aside>
        </>
    )
}
