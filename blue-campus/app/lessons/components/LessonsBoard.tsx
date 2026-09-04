"use client"

import { useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, CalendarDays, CalendarCheck2, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import PageHeader from "@/components/page-header"
import LessonCard from "./card"
import LessonEditSheet from "./LessonEditSheet"
import LessonTrackingSheet from "./LessonTrackingSheet"
import BookNextLessonDialog from "./BookNextLessonDialog"

type Option = { id: number; name?: string; first_name?: string; last_name?: string }

type Lesson = {
    id: number
    course: { id: number; name: string } | null
    instructor: { id: number; first_name: string; last_name: string } | null
    boat: { id: number; name: string } | null
    participants: { id: number; student: { id: number; first_name: string; last_name: string; phone: string | null } | null }[]
    payments: { id: number; student_id: number; amount: number; type: string; status: string | null }[]
    date: string
    start_time: string
    end_time: string
    status: string | null
    notes: string | null
}

type Registration = { id: number; student_id: number; course_id: number }
type SkillTracking = {
    id: number
    student_registration: number
    status: string | null
    description: string | null
    skill: { id: number; skill_name: string } | null
}

type Options = {
    instructors: Option[]
    boats: Option[]
    courses: Option[]
    students: Option[]
    registrations: Registration[]
    skillTracking: SkillTracking[]
}

type Props = {
    lessons: Lesson[]
    options: Options
}

const COLUMN_WIDTH = 336 // card column width incl. gap

// Parses a "YYYY-MM-DD" string as a UTC timestamp so day-arithmetic never
// crosses a local-timezone offset (which would otherwise shift the date by
// a day for anyone not in UTC, once converted back with toISOString()).
function toUTCTime(date: string): number {
    const [year, month, day] = date.split("-").map(Number)
    return Date.UTC(year, month - 1, day)
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000

function generateDateRange(start: string, end: string): string[] {
    const dates: string[] = []
    const lastTime = toUTCTime(end)
    let cursorTime = toUTCTime(start)

    while (cursorTime <= lastTime) {
        dates.push(new Date(cursorTime).toISOString().slice(0, 10))
        cursorTime += ONE_DAY_MS
    }

    return dates
}

// Local calendar date (not UTC) since "today" should match the viewer's own clock.
function todayDateString(): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function weekdayLabel(date: string): string {
    return WEEKDAYS[new Date(toUTCTime(date)).getUTCDay()]
}

type Action = { lessonId: number; type: "edit" | "track" | "book" }

export default function LessonsBoard({ lessons, options }: Props) {
    const [action, setAction] = useState<Action | null>(null)
    const [courseFilter, setCourseFilter] = useState<string>("all")
    const scrollRef = useRef<HTMLDivElement>(null)
    const columnRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const today = todayDateString()

    const activeLesson = lessons.find((lesson) => lesson.id === action?.lessonId) ?? null

    function closeAction() {
        setAction(null)
    }

    const dates = useMemo(() => {
        if (lessons.length === 0) return []
        const allDates = lessons.map((lesson) => lesson.date)
        const minDate = allDates.reduce((a, b) => (a < b ? a : b))
        const maxDate = allDates.reduce((a, b) => (a > b ? a : b))
        return generateDateRange(minDate, maxDate)
    }, [lessons])

    const filteredLessons = useMemo(
        () =>
            courseFilter === "all"
                ? lessons
                : lessons.filter((lesson) => lesson.course?.id.toString() === courseFilter),
        [lessons, courseFilter]
    )

    const lessonsByDate = useMemo(
        () =>
            filteredLessons.reduce<Record<string, Lesson[]>>((groups, lesson) => {
                (groups[lesson.date] ??= []).push(lesson)
                return groups
            }, {}),
        [filteredLessons]
    )

    function scroll(direction: "left" | "right") {
        scrollRef.current?.scrollBy({
            left: direction === "left" ? -COLUMN_WIDTH : COLUMN_WIDTH,
            behavior: "smooth",
        })
    }

    function scrollToToday() {
        columnRefs.current[today]?.scrollIntoView({
            behavior: "smooth",
            inline: "start",
            block: "nearest",
        })
    }

    const todayInRange = dates.includes(today)

    return (
        <div>
            <PageHeader icon={CalendarDays} title="Lessons">
                <div className="flex items-center gap-2">
                    <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger className="w-44">
                            <SelectValue placeholder="Filter by course" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All courses</SelectItem>
                            {options.courses.map((course) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {dates.length > 0 && (
                        <>
                            <Button
                                variant="outline"
                                disabled={!todayInRange}
                                onClick={scrollToToday}
                            >
                                <CalendarCheck2 />
                                Today
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => scroll("left")}>
                                <ChevronLeft />
                                <span className="sr-only">Show earlier lessons</span>
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => scroll("right")}>
                                <ChevronRight />
                                <span className="sr-only">Show later lessons</span>
                            </Button>
                        </>
                    )}
                    <Button asChild size="icon">
                        <Link href="/lessons/new-lesson">
                            <Plus />
                            <span className="sr-only">New lesson</span>
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            {dates.length === 0 && (
                <p className="text-muted-foreground m-5">No lessons scheduled yet.</p>
            )}

            {dates.length > 0 && (
                <div
                    ref={scrollRef}
                    className="flex flex-row items-start gap-4 overflow-x-auto scroll-smooth pb-4"
                >
                    {dates.map((date) => {
                        const isToday = date === today

                        return (
                        <div
                            key={date}
                            ref={(el) => { columnRefs.current[date] = el }}
                            className="flex-none w-80"
                        >
                            <div
                                className={`mb-3 inline-flex items-baseline gap-2 rounded-lg px-2 py-1 ${
                                    isToday ? "bg-primary text-primary-foreground" : ""
                                }`}
                            >
                                <span
                                    className={`text-xs font-semibold tracking-wide uppercase ${
                                        isToday ? "text-primary-foreground/80" : "text-muted-foreground"
                                    }`}
                                >
                                    {weekdayLabel(date)}
                                </span>
                                <h2 className="font-heading text-lg font-semibold">{formatDate(date)}</h2>
                            </div>
                            <div className="flex flex-col gap-2">
                                {(lessonsByDate[date] ?? []).length === 0 && (
                                    <p className="text-sm text-muted-foreground">No lessons</p>
                                )}
                                {(lessonsByDate[date] ?? []).map((lesson) => (
                                    <LessonCard
                                        key={lesson.id}
                                        lesson={lesson}
                                        onEdit={() => setAction({ lessonId: lesson.id, type: "edit" })}
                                        onTrack={() => setAction({ lessonId: lesson.id, type: "track" })}
                                        onBookNext={() => setAction({ lessonId: lesson.id, type: "book" })}
                                    />
                                ))}
                            </div>
                        </div>
                        )
                    })}
                </div>
            )}

            <LessonEditSheet
                lesson={action?.type === "edit" ? activeLesson : null}
                options={options}
                onClose={closeAction}
            />
            <LessonTrackingSheet
                lesson={action?.type === "track" ? activeLesson : null}
                options={options}
                onClose={closeAction}
            />
            <BookNextLessonDialog
                lesson={action?.type === "book" ? activeLesson : null}
                onClose={closeAction}
            />
        </div>
    )
}
