"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { duplicateLesson } from "../actions"

type Props = {
    lessonId: number
    defaultDate: string
    defaultStartTime: string
    defaultEndTime: string
}

export default function BookNextLesson({ lessonId, defaultDate, defaultStartTime, defaultEndTime }: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        await duplicateLesson(formData)
        router.refresh()
        setOpen(false)
    }

    if (!open) {
        return (
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                Book next lesson
            </Button>
        )
    }

    return (
        <form action={handleSubmit} className="flex flex-col gap-3 rounded-lg border p-3">
            <input type="hidden" name="source_lesson_id" value={lessonId} />

            <p className="text-sm text-muted-foreground">
                Same course, boat, instructor and participants — just pick a new date and time.
            </p>

            <div className="grid grid-cols-3 gap-2">
                <Field>
                    <FieldLabel htmlFor="next-date">Date</FieldLabel>
                    <Input id="next-date" name="date" type="date" defaultValue={defaultDate} required />
                </Field>
                <Field>
                    <FieldLabel htmlFor="next-start">Start</FieldLabel>
                    <Input id="next-start" name="start_time" type="time" defaultValue={defaultStartTime} required />
                </Field>
                <Field>
                    <FieldLabel htmlFor="next-end">End</FieldLabel>
                    <Input id="next-end" name="end_time" type="time" defaultValue={defaultEndTime} required />
                </Field>
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                    Cancel
                </Button>
                <Button type="submit" size="sm">
                    Book
                </Button>
            </div>
        </form>
    )
}
