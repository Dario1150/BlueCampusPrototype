"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { duplicateLesson } from "../actions"

type Lesson = {
    id: number
    date: string
    start_time: string
    end_time: string
    course: { name: string } | null
}

type Props = {
    lesson: Lesson | null
    onClose: () => void
}

// UTC-based so the result never shifts by a day for timezones ahead of UTC
// (parsing "YYYY-MM-DDT00:00:00" as local time and converting back via
// toISOString() would otherwise cross midnight and land on the wrong day).
function nextWeekDate(date: string) {
    const [year, month, day] = date.split("-").map(Number)
    return new Date(Date.UTC(year, month - 1, day + 7)).toISOString().slice(0, 10)
}

export default function BookNextLessonDialog({ lesson, onClose }: Props) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        try {
            await duplicateLesson(formData)
            router.refresh()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not book the next lesson.")
        }
    }

    return (
        <Dialog
            open={!!lesson}
            onOpenChange={(open) => {
                if (!open) {
                    setError(null)
                    onClose()
                }
            }}
        >
            <DialogContent>
                {lesson && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Book next lesson</DialogTitle>
                        </DialogHeader>

                        <form action={handleSubmit} className="flex flex-col gap-4">
                            <input type="hidden" name="source_lesson_id" value={lesson.id} />

                            <p className="text-sm text-muted-foreground">
                                {lesson.course?.name ?? "This lesson"} — same course, boat, instructor and
                                participants, just pick a new date and time.
                            </p>

                            <div className="grid grid-cols-3 gap-2">
                                <Field>
                                    <FieldLabel htmlFor="next-date">Date</FieldLabel>
                                    <Input
                                        id="next-date"
                                        name="date"
                                        type="date"
                                        defaultValue={nextWeekDate(lesson.date)}
                                        required
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="next-start">Start</FieldLabel>
                                    <Input
                                        id="next-start"
                                        name="start_time"
                                        type="time"
                                        defaultValue={lesson.start_time?.slice(0, 5)}
                                        required
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel htmlFor="next-end">End</FieldLabel>
                                    <Input
                                        id="next-end"
                                        name="end_time"
                                        type="time"
                                        defaultValue={lesson.end_time?.slice(0, 5)}
                                        required
                                    />
                                </Field>
                            </div>

                            {error && <p className="text-sm text-destructive">{error}</p>}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit">Book</Button>
                            </DialogFooter>
                        </form>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
