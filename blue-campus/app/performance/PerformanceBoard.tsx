"use client"

import { useMemo, useState } from "react"
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from "recharts"
import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown, BookOpen, Users, Anchor, Wallet, CalendarCheck2 } from "lucide-react"
import PageHeader from "@/components/page-header"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Course = { id: number; name: string }
type Registration = { id: number; course_id: number | null; status: string | null; registration_date: string | null }
type Lesson = {
    id: number
    course_id: number | null
    instructor_id: number | null
    boat_id: number | null
    date: string
    status: string | null
}
type Transaction = {
    id: number
    category: string
    amount: number
    date: string
    instructor_id: number | null
    lesson_id: number | null
    registration_id: number | null
    boat_id: number | null
}
type Instructor = { id: number; first_name: string; last_name: string }
type Boat = { id: number; name: string }

type Props = {
    courses: Course[]
    registrations: Registration[]
    lessons: Lesson[]
    transactions: Transaction[]
    instructors: Instructor[]
    boats: Boat[]
}

const RANGE_OPTIONS = [
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "year", label: "This year" },
    { value: "all", label: "All time" },
] as const

type Range = (typeof RANGE_OPTIONS)[number]["value"]

const REVENUE_CATEGORIES = new Set(["Lesson Fee", "Registration Fee"])
const ALL_COST_CATEGORIES = new Set(["Gas", "Repair", "Salary"])
const BOAT_COST_CATEGORIES = new Set(["Gas", "Repair"])

const PALETTE = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
]
const REVENUE_COLOR = "#10b981"
const COST_COLOR = "var(--destructive)"

function cutoffDate(range: Range): string | null {
    if (range === "all") return null

    const now = new Date()
    if (range === "year") {
        return `${now.getFullYear()}-01-01`
    }

    now.setDate(now.getDate() - (range === "30d" ? 30 : 90))
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

function formatMoney(value: number) {
    return value.toFixed(2)
}

const tooltipStyle = {
    contentStyle: {
        backgroundColor: "var(--popover)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        fontSize: 12,
    },
    labelStyle: { color: "var(--foreground)", fontWeight: 600, marginBottom: 4 },
}

function StatCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: LucideIcon
    label: string
    value: string
    tone: "primary" | "positive" | "negative"
}) {
    const toneClass =
        tone === "positive"
            ? "bg-emerald-100 text-emerald-700"
            : tone === "negative"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"

    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className={`inline-flex size-9 items-center justify-center rounded-lg ${toneClass}`}>
                <Icon className="size-5" />
            </div>
            <div className="pt-3 text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
        </div>
    )
}

function Section({
    icon: Icon,
    title,
    description,
    children,
}: {
    icon: LucideIcon
    title: string
    description: string
    children: React.ReactNode
}) {
    return (
        <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 pb-4">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                </div>
                <div>
                    <h2 className="font-heading text-lg font-semibold">{title}</h2>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
            </div>
            {children}
        </div>
    )
}

export default function PerformanceBoard({
    courses,
    registrations,
    lessons,
    transactions,
    instructors,
    boats,
}: Props) {
    const [range, setRange] = useState<Range>("90d")
    const [courseFilter, setCourseFilter] = useState<string>("all")

    const cutoff = cutoffDate(range)

    const filteredLessons = useMemo(
        () => lessons.filter((lesson) => !cutoff || lesson.date >= cutoff),
        [lessons, cutoff]
    )
    const filteredRegistrations = useMemo(
        () => registrations.filter((registration) => !cutoff || (registration.registration_date ?? "") >= cutoff),
        [registrations, cutoff]
    )
    const filteredTransactions = useMemo(
        () => transactions.filter((transaction) => !cutoff || transaction.date >= cutoff),
        [transactions, cutoff]
    )

    const lessonCourseMap = useMemo(() => new Map(lessons.map((l) => [l.id, l.course_id])), [lessons])
    const lessonBoatMap = useMemo(() => new Map(lessons.map((l) => [l.id, l.boat_id])), [lessons])
    const registrationCourseMap = useMemo(() => new Map(registrations.map((r) => [r.id, r.course_id])), [registrations])

    const totalRevenue = useMemo(
        () =>
            filteredTransactions
                .filter((t) => REVENUE_CATEGORIES.has(t.category))
                .reduce((sum, t) => sum + Number(t.amount), 0),
        [filteredTransactions]
    )
    const totalCosts = useMemo(
        () =>
            filteredTransactions
                .filter((t) => ALL_COST_CATEGORIES.has(t.category))
                .reduce((sum, t) => sum + Number(t.amount), 0),
        [filteredTransactions]
    )
    const completedLessons = useMemo(
        () => filteredLessons.filter((l) => l.status === "Completed").length,
        [filteredLessons]
    )
    const net = totalRevenue - totalCosts

    const courseRows = useMemo(() => {
        const rows = courses.map((course) => {
            const registrationsCount = filteredRegistrations.filter((r) => r.course_id === course.id).length
            const lessonsCount = filteredLessons.filter((l) => l.course_id === course.id).length
            const revenue = filteredTransactions.reduce((sum, t) => {
                if (t.category === "Lesson Fee" && lessonCourseMap.get(t.lesson_id ?? -1) === course.id) {
                    return sum + Number(t.amount)
                }
                if (t.category === "Registration Fee" && registrationCourseMap.get(t.registration_id ?? -1) === course.id) {
                    return sum + Number(t.amount)
                }
                return sum
            }, 0)
            return { id: course.id, name: course.name, registrations: registrationsCount, lessons: lessonsCount, revenue }
        })

        const scoped = courseFilter === "all" ? rows : rows.filter((row) => row.id.toString() === courseFilter)
        return scoped.sort((a, b) => b.revenue - a.revenue)
    }, [courses, filteredRegistrations, filteredLessons, filteredTransactions, lessonCourseMap, registrationCourseMap, courseFilter])

    const instructorRows = useMemo(() => {
        return instructors
            .map((instructor) => {
                const name = `${instructor.first_name} ${instructor.last_name}`
                const lessonsCount = filteredLessons.filter((l) => l.instructor_id === instructor.id).length
                const revenue = filteredTransactions
                    .filter((t) => t.category === "Lesson Fee" && t.instructor_id === instructor.id)
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                const salary = filteredTransactions
                    .filter((t) => t.category === "Salary" && t.instructor_id === instructor.id)
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                return { id: instructor.id, name, lessons: lessonsCount, revenue, salary }
            })
            .sort((a, b) => b.lessons - a.lessons)
    }, [instructors, filteredLessons, filteredTransactions])

    const boatRows = useMemo(() => {
        return boats
            .map((boat) => {
                const revenue = filteredTransactions.reduce((sum, t) => {
                    if (t.category === "Lesson Fee" && lessonBoatMap.get(t.lesson_id ?? -1) === boat.id) {
                        return sum + Number(t.amount)
                    }
                    return sum
                }, 0)
                const cost = filteredTransactions
                    .filter((t) => BOAT_COST_CATEGORIES.has(t.category) && t.boat_id === boat.id)
                    .reduce((sum, t) => sum + Number(t.amount), 0)
                return { id: boat.id, name: boat.name, revenue, cost, net: revenue - cost }
            })
            .sort((a, b) => b.net - a.net)
    }, [boats, filteredTransactions, lessonBoatMap])

    return (
        <div className="container mx-auto py-10">
            <PageHeader icon={TrendingUp} title="Performance" subtitle="How the school is doing">
                <div className="flex items-center gap-2">
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Filter by course" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All courses</SelectItem>
                            {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={range} onValueChange={(value) => setRange(value as Range)}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {RANGE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </PageHeader>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard icon={Wallet} label="Revenue" value={formatMoney(totalRevenue)} tone="positive" />
                <StatCard icon={Wallet} label="Costs" value={formatMoney(totalCosts)} tone="negative" />
                <StatCard
                    icon={net >= 0 ? TrendingUp : TrendingDown}
                    label="Net"
                    value={formatMoney(net)}
                    tone={net >= 0 ? "positive" : "negative"}
                />
                <StatCard icon={CalendarCheck2} label="Lessons completed" value={completedLessons.toString()} tone="primary" />
            </div>

            <Section icon={BookOpen} title="Courses" description="Revenue generated per course">
                {courseRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No course activity in this range.</p>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={courseRows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                                <YAxis tick={{ fontSize: 12 }} width={56} />
                                <Tooltip
                                    {...tooltipStyle}
                                    formatter={(value) => formatMoney(Number(value))}
                                />
                                <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]}>
                                    {courseRows.map((row, index) => (
                                        <Cell key={row.id} fill={PALETTE[index % PALETTE.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        <table className="mt-4 w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                                    <th className="py-2 font-semibold">Course</th>
                                    <th className="py-2 font-semibold">Registrations</th>
                                    <th className="py-2 font-semibold">Lessons</th>
                                    <th className="py-2 text-right font-semibold">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courseRows.map((row) => (
                                    <tr key={row.id} className="border-b last:border-0">
                                        <td className="py-2 font-medium">{row.name}</td>
                                        <td className="py-2 text-muted-foreground">{row.registrations}</td>
                                        <td className="py-2 text-muted-foreground">{row.lessons}</td>
                                        <td className="py-2 text-right font-medium">{formatMoney(row.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </Section>

            <Section icon={Users} title="Instructors" description="Lessons taught per instructor">
                {instructorRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No instructor activity in this range.</p>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={instructorRows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                                <YAxis tick={{ fontSize: 12 }} width={40} allowDecimals={false} />
                                <Tooltip {...tooltipStyle} />
                                <Bar dataKey="lessons" name="Lessons" radius={[6, 6, 0, 0]}>
                                    {instructorRows.map((row, index) => (
                                        <Cell key={row.id} fill={PALETTE[index % PALETTE.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        <table className="mt-4 w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                                    <th className="py-2 font-semibold">Instructor</th>
                                    <th className="py-2 font-semibold">Lessons</th>
                                    <th className="py-2 text-right font-semibold">Revenue generated</th>
                                    <th className="py-2 text-right font-semibold">Salary</th>
                                </tr>
                            </thead>
                            <tbody>
                                {instructorRows.map((row) => (
                                    <tr key={row.id} className="border-b last:border-0">
                                        <td className="py-2 font-medium">{row.name}</td>
                                        <td className="py-2 text-muted-foreground">{row.lessons}</td>
                                        <td className="py-2 text-right font-medium">{formatMoney(row.revenue)}</td>
                                        <td className="py-2 text-right text-muted-foreground">{formatMoney(row.salary)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </Section>

            <Section icon={Anchor} title="Boats" description="Revenue vs. costs (gas, repairs) per boat">
                {boatRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No boat activity in this range.</p>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={boatRows} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} width={56} />
                                <Tooltip {...tooltipStyle} formatter={(value) => formatMoney(Number(value))} />
                                <Bar dataKey="revenue" name="Revenue" fill={REVENUE_COLOR} radius={[6, 6, 0, 0]} />
                                <Bar dataKey="cost" name="Cost" fill={COST_COLOR} radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>

                        <table className="mt-4 w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                                    <th className="py-2 font-semibold">Boat</th>
                                    <th className="py-2 text-right font-semibold">Revenue</th>
                                    <th className="py-2 text-right font-semibold">Cost</th>
                                    <th className="py-2 text-right font-semibold">Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boatRows.map((row) => (
                                    <tr key={row.id} className="border-b last:border-0">
                                        <td className="py-2 font-medium">{row.name}</td>
                                        <td className="py-2 text-right text-muted-foreground">{formatMoney(row.revenue)}</td>
                                        <td className="py-2 text-right text-muted-foreground">{formatMoney(row.cost)}</td>
                                        <td
                                            className={`py-2 text-right font-medium ${
                                                row.net >= 0 ? "text-emerald-700" : "text-destructive"
                                            }`}
                                        >
                                            {formatMoney(row.net)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <p className="mt-3 text-xs text-muted-foreground">
                            Costs only include gas and repair transactions tagged with a boat. Tag a boat when logging
                            those expenses on the Transactions page to see them reflected here.
                        </p>
                    </>
                )}
            </Section>
        </div>
    )
}
