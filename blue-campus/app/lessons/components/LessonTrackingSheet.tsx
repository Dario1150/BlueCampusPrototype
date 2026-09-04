"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Flag, PartyPopper } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatDate } from "@/lib/utils"
import { finishLesson } from "../actions"
import ParticipantPayment from "./ParticipantPayment"
import ParticipantSkills from "./ParticipantSkills"

type Option = { id: number; name?: string; first_name?: string; last_name?: string }

type Lesson = {
    id: number
    course: { id: number; name: string } | null
    instructor: { id: number; first_name: string; last_name: string } | null
    participants: { id: number; student: { id: number; first_name: string; last_name: string } | null }[]
    payments: { id: number; student_id: number; amount: number; type: string; status: string | null }[]
    date: string
    start_time: string
    status: string | null
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
    registrations: Registration[]
    skillTracking: SkillTracking[]
}

type Props = {
    lesson: Lesson | null
    options: Options
    onClose: () => void
}

const AVATAR_STYLES = [
    "bg-chart-1/15 text-chart-1",
    "bg-chart-2/15 text-chart-2",
    "bg-chart-3/15 text-chart-3",
    "bg-chart-4/15 text-chart-4",
    "bg-chart-5/15 text-chart-5",
]

function avatarStyle(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
    return AVATAR_STYLES[hash % AVATAR_STYLES.length]
}

function initials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
}

const SKILL_SCORES: Record<string, number> = { Beginner: 0, Practicing: 0.5, Expert: 1 }

function skillMastery(skills: SkillTracking[]): number | null {
    if (skills.length === 0) return null
    const total = skills.reduce((sum, entry) => sum + (SKILL_SCORES[entry.status ?? "Beginner"] ?? 0), 0)
    return Math.round((total / skills.length) * 100)
}

function paymentBadge(payments: { status: string | null }[]) {
    if (payments.some((payment) => payment.status === "Paid")) {
        return { label: "Paid", className: "bg-emerald-100 text-emerald-700" }
    }
    if (payments.length > 0) {
        return { label: "Pending", className: "bg-sky-100 text-sky-700" }
    }
    return { label: "No payment", className: "bg-amber-100 text-amber-800" }
}

export default function LessonTrackingSheet({ lesson, options, onClose }: Props) {
    const router = useRouter()
    const [isFinishing, startFinishing] = useTransition()
    const [justFinished, setJustFinished] = useState(false)
    const [finishError, setFinishError] = useState<string | null>(null)

    function getSkillsForStudent(studentId: number) {
        if (!lesson?.course) return { hasRegistration: false, skills: [] as SkillTracking[] }

        const registration = options.registrations.find(
            (r) => r.student_id === studentId && r.course_id === lesson.course!.id
        )

        if (!registration) return { hasRegistration: false, skills: [] as SkillTracking[] }

        return {
            hasRegistration: true,
            skills: options.skillTracking.filter(
                (entry) => entry.student_registration === registration.id
            ),
        }
    }

    const isCompleted = lesson?.status === "Completed"

    const rows = (lesson?.participants ?? []).map((participant) => {
        const { hasRegistration, skills } = participant.student
            ? getSkillsForStudent(participant.student.id)
            : { hasRegistration: false, skills: [] as SkillTracking[] }

        const payments = participant.student
            ? (lesson?.payments ?? []).filter((payment) => payment.student_id === participant.student!.id)
            : []

        return { participant, hasRegistration, skills, payments }
    })

    const paidCount = rows.filter((row) => row.payments.some((payment) => payment.status === "Paid")).length
    const progressPct = rows.length > 0 ? Math.round((paidCount / rows.length) * 100) : 0

    function handleClose(open: boolean) {
        if (!open) {
            setJustFinished(false)
            setFinishError(null)
            onClose()
        }
    }

    function handleFinish() {
        if (!lesson) return
        setFinishError(null)
        startFinishing(async () => {
            try {
                const formData = new FormData()
                formData.set("id", String(lesson.id))
                await finishLesson(formData)
                router.refresh()
                setJustFinished(true)
                setTimeout(() => {
                    setJustFinished(false)
                    onClose()
                }, 1100)
            } catch (err) {
                setFinishError(err instanceof Error ? err.message : "Could not finish this lesson.")
            }
        })
    }

    return (
        <Sheet open={!!lesson} onOpenChange={handleClose}>
            <SheetContent className="flex flex-col overflow-y-auto">
                {lesson && (
                    justFinished ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center duration-300 animate-in fade-in zoom-in-95">
                            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                                <PartyPopper className="size-8" />
                            </div>
                            <h2 className="font-heading text-lg font-semibold">Lesson completed!</h2>
                            <p className="text-sm text-muted-foreground">
                                Nice work — {lesson.course?.name ?? "the lesson"} is wrapped up.
                            </p>
                        </div>
                    ) : (
                        <>
                            <SheetHeader>
                                <div className="flex items-center gap-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Flag className="size-4" />
                                    </span>
                                    <div>
                                        <SheetTitle>{isCompleted ? "Lesson summary" : "Finish lesson"}</SheetTitle>
                                        <SheetDescription>
                                            {lesson.course?.name ?? "No course"} · {formatDate(lesson.date)} · {lesson.start_time?.slice(0, 5)}
                                        </SheetDescription>
                                    </div>
                                </div>

                                {isCompleted ? (
                                    <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                                        This lesson is marked completed. You can still adjust tracked skills and payments below.
                                    </p>
                                ) : (
                                    rows.length > 0 && (
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                <span>Payments collected</span>
                                                <span>{paidCount}/{rows.length}</span>
                                            </div>
                                            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary transition-all duration-500"
                                                    style={{ width: `${progressPct}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                )}
                            </SheetHeader>

                            <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4">
                                {rows.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No participants yet.</p>
                                )}

                                {rows.map(({ participant, hasRegistration, skills, payments }) => {
                                    const name = participant.student
                                        ? `${participant.student.first_name} ${participant.student.last_name}`
                                        : "Unknown student"
                                    const mastery = skillMastery(skills)
                                    const badge = paymentBadge(payments)

                                    return (
                                        <div key={participant.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarStyle(name)}`}>
                                                    {initials(name)}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-medium">{name}</p>
                                                    {mastery !== null && (
                                                        <div className="mt-1 flex items-center gap-1.5">
                                                            <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                                                                <div
                                                                    className="h-full rounded-full bg-chart-2 transition-all duration-500"
                                                                    style={{ width: `${mastery}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[11px] text-muted-foreground">{mastery}% skill mastery</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${badge.className}`}>
                                                    {badge.label}
                                                </span>
                                            </div>

                                            <Separator />

                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                {participant.student && hasRegistration ? (
                                                    <ParticipantSkills studentName={name} skills={skills} />
                                                ) : (
                                                    <span className="shrink-0 text-xs text-muted-foreground">Not registered for this course</span>
                                                )}
                                                {participant.student && (
                                                    <ParticipantPayment
                                                        lessonId={lesson.id}
                                                        lessonDate={lesson.date}
                                                        studentId={participant.student.id}
                                                        defaultInstructorId={lesson.instructor?.id}
                                                        payments={payments}
                                                        instructors={options.instructors}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {!isCompleted && (
                                <SheetFooter>
                                    {finishError && <p className="text-sm text-destructive">{finishError}</p>}
                                    <Button type="button" className="w-full" disabled={isFinishing} onClick={handleFinish}>
                                        <Flag className="size-4" />
                                        {isFinishing ? "Finishing…" : "Finish lesson"}
                                    </Button>
                                </SheetFooter>
                            )}
                        </>
                    )
                )}
            </SheetContent>
        </Sheet>
    )
}
