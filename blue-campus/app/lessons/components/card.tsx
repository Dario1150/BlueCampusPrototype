"use client"

import { useState } from "react"
import { Pencil, Flag, CircleCheck, CalendarPlus, Phone } from "lucide-react"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"

type Participant = {
    id: number
    student: {
        first_name: string
        last_name: string
        phone: string | null
    } | null
}

type Lesson = {
    id: number
    course: {
        name: string
    } | null
    instructor: {
        first_name: string
        last_name: string
    } | null
    boat: {
        name: string
    } | null
    participants: Participant[]
    date: string
    start_time: string
    end_time: string
    status: string | null
    notes: string | null
}

type Props = {
    lesson: Lesson
    canWrite: boolean
    onEdit: () => void
    onTrack: () => void
    onBookNext: () => void
}

const STATUS_STYLES: Record<string, string> = {
    Open: "bg-amber-100 text-amber-800",
    Scheduled: "bg-sky-100 text-sky-800",
    Completed: "bg-emerald-100 text-emerald-800",
    Cancelled: "bg-gray-200 text-gray-600",
}

export default function LessonCard({ lesson, canWrite, onEdit, onTrack, onBookNext }: Props) {
    const statusStyle = STATUS_STYLES[lesson.status ?? ""] ?? "bg-gray-200 text-gray-600"
    const isCompleted = lesson.status === "Completed"
    const isMobile = useIsMobile()
    const [mobileOpen, setMobileOpen] = useState(false)

    const trigger = (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2 text-sm transition-colors hover:border-primary/50 hover:bg-accent/40">
            <span className="font-medium">
                {lesson.start_time?.slice(0, 5)}
            </span>
            <span className="flex-1 truncate">
                {lesson.course?.name ?? "No course"}
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${statusStyle}`}>
                {lesson.status ?? "Unscheduled"}
            </span>
        </div>
    )

    function renderDetails(afterAction?: () => void) {
        function runAction(action: () => void) {
            afterAction?.()
            action()
        }

        return (
            <>
                <div className="flex flex-row place-items-center place-content-between">
                    <div>
                        <h1 className="font-heading text-lg font-bold">
                            {lesson.course?.name ?? "No course"}
                        </h1>
                        <h1 className="text-sm">{lesson.boat?.name ?? "No boat assigned"}</h1>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <h1 className="text-sm">
                            {lesson.start_time?.slice(0, 5)}–{lesson.end_time?.slice(0, 5)}
                        </h1>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${statusStyle}`}>
                            {lesson.status ?? "Unscheduled"}
                        </span>
                    </div>
                </div>

                <hr className="my-3" />

                <div className="flex flex-col gap-3">
                    <div>
                        <h2 className="text-sm font-bold">Instructor</h2>
                        <h2 className="text-sm">
                            {lesson.instructor
                                ? `${lesson.instructor.first_name} ${lesson.instructor.last_name}`
                                : "Unassigned"}
                        </h2>
                    </div>

                    <div>
                        <h2 className="text-sm font-bold">Participants</h2>
                        <div className="mt-1 flex flex-col gap-1">
                            {lesson.participants.length === 0 && (
                                <h3 className="text-sm text-muted-foreground">None yet</h3>
                            )}
                            {lesson.participants.map((participant) => (
                                <div key={participant.id} className="flex items-center justify-between gap-2">
                                    <h3 className="truncate text-sm">
                                        {participant.student
                                            ? `${participant.student.first_name} ${participant.student.last_name}`
                                            : "Unknown student"}
                                    </h3>
                                    {participant.student?.phone && (
                                        <Button
                                            asChild
                                            type="button"
                                            variant="ghost"
                                            size="icon-xs"
                                            className="shrink-0 text-primary hover:text-primary"
                                        >
                                            <a href={`tel:${participant.student.phone}`}>
                                                <Phone className="size-3" />
                                                <span className="sr-only">
                                                    Call {participant.student.first_name} {participant.student.last_name}
                                                </span>
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {canWrite && (
                    <div className="mt-3 flex items-center justify-end gap-1 border-t pt-3">
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => runAction(onEdit)}>
                            <Pencil className="size-4" />
                            <span className="sr-only">Edit lesson</span>
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => runAction(onTrack)}
                            className={!isCompleted ? "text-primary hover:text-primary" : "text-emerald-600 hover:text-emerald-600"}
                        >
                            {isCompleted ? <CircleCheck className="size-4" /> : <Flag className="size-4" />}
                            <span className="sr-only">
                                {isCompleted ? "Review lesson tracking" : "Finish lesson"}
                            </span>
                        </Button>
                        <Button type="button" variant="ghost" size="icon-sm" onClick={() => runAction(onBookNext)}>
                            <CalendarPlus className="size-4" />
                            <span className="sr-only">Book next lesson</span>
                        </Button>
                    </div>
                )}
            </>
        )
    }

    if (isMobile) {
        return (
            <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
                <DialogTrigger asChild>{trigger}</DialogTrigger>
                <DialogContent>
                    <DialogTitle className="sr-only">
                        {lesson.course?.name ?? "Lesson"} details
                    </DialogTitle>
                    {renderDetails(() => setMobileOpen(false))}
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <HoverCard>
            <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
            <HoverCardContent side="right" align="start" onPointerDownOutside={(e) => e.preventDefault()}>
                {renderDetails()}
            </HoverCardContent>
        </HoverCard>
    )
}
