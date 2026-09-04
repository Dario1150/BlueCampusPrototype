"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet"
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { updateLesson, deleteLesson, addParticipant, removeParticipant } from "../actions"

type Option = { id: number; name?: string; first_name?: string; last_name?: string }

type Lesson = {
    id: number
    course: { id: number; name: string } | null
    instructor: { id: number; first_name: string; last_name: string } | null
    boat: { id: number; name: string } | null
    participants: { id: number; student: { id: number; first_name: string; last_name: string } | null }[]
    date: string
    start_time: string
    end_time: string
    status: string | null
    notes: string | null
}

type Options = {
    instructors: Option[]
    boats: Option[]
    courses: Option[]
    students: Option[]
}

type Props = {
    lesson: Lesson | null
    options: Options
    onClose: () => void
}

const STATUSES = ["Open", "Scheduled", "Completed", "Cancelled"]

export default function LessonEditSheet({ lesson, options, onClose }: Props) {
    const router = useRouter()
    const [formError, setFormError] = useState<string | null>(null)
    const [participantError, setParticipantError] = useState<string | null>(null)

    async function handleUpdate(formData: FormData) {
        setFormError(null)
        try {
            await updateLesson(formData)
            router.refresh()
            onClose()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Could not save the lesson.")
        }
    }

    async function handleDelete(formData: FormData) {
        try {
            await deleteLesson(formData)
            router.refresh()
            onClose()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : "Could not delete the lesson.")
        }
    }

    async function handleAddParticipant(formData: FormData) {
        setParticipantError(null)
        try {
            await addParticipant(formData)
            router.refresh()
        } catch (err) {
            setParticipantError(err instanceof Error ? err.message : "Could not add participant.")
        }
    }

    async function handleRemoveParticipant(formData: FormData) {
        try {
            await removeParticipant(formData)
            router.refresh()
        } catch (err) {
            setParticipantError(err instanceof Error ? err.message : "Could not remove participant.")
        }
    }

    const availableStudents = lesson
        ? options.students.filter(
              (student) => !lesson.participants.some((p) => p.student?.id === student.id)
          )
        : []

    return (
        <Sheet
            open={!!lesson}
            onOpenChange={(open) => {
                if (!open) {
                    setFormError(null)
                    setParticipantError(null)
                    onClose()
                }
            }}
        >
            <SheetContent className="overflow-y-auto">
                {lesson && (
                    <>
                        <SheetHeader>
                            <SheetTitle>Edit lesson</SheetTitle>
                        </SheetHeader>

                        <form action={handleUpdate} className="flex flex-col gap-5 px-4">
                            <input type="hidden" name="id" value={lesson.id} />

                            <FieldGroup>
                                <Field>
                                    <FieldLabel htmlFor="form-course">Course</FieldLabel>
                                    <Select name="course_id" defaultValue={lesson.course?.id?.toString()}>
                                        <SelectTrigger id="form-course" className="w-full">
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.courses.map((course) => (
                                                <SelectItem key={course.id} value={course.id.toString()}>
                                                    {course.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="form-instructor">Instructor</FieldLabel>
                                        <Select name="instructor_id" defaultValue={lesson.instructor?.id?.toString()}>
                                            <SelectTrigger id="form-instructor" className="w-full">
                                                <SelectValue placeholder="Unassigned" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.instructors.map((instructor) => (
                                                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                                        {instructor.first_name} {instructor.last_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="form-boat">Boat</FieldLabel>
                                        <Select name="boat_id" defaultValue={lesson.boat?.id?.toString()}>
                                            <SelectTrigger id="form-boat" className="w-full">
                                                <SelectValue placeholder="Unassigned" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {options.boats.map((boat) => (
                                                    <SelectItem key={boat.id} value={boat.id.toString()}>
                                                        {boat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor="form-date">Date</FieldLabel>
                                        <Input id="form-date" name="date" type="date" defaultValue={lesson.date} required />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="form-start">Start</FieldLabel>
                                        <Input id="form-start" name="start_time" type="time" defaultValue={lesson.start_time?.slice(0, 5)} required />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="form-end">End</FieldLabel>
                                        <Input id="form-end" name="end_time" type="time" defaultValue={lesson.end_time?.slice(0, 5)} required />
                                    </Field>
                                </div>

                                <Field>
                                    <FieldLabel htmlFor="form-status">Status</FieldLabel>
                                    <Select name="status" defaultValue={lesson.status ?? undefined}>
                                        <SelectTrigger id="form-status" className="w-full">
                                            <SelectValue placeholder="Select a status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    {status}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="form-notes">Notes</FieldLabel>
                                    <Textarea id="form-notes" name="notes" defaultValue={lesson.notes ?? ""} />
                                </Field>

                                {formError && <p className="text-sm text-destructive">{formError}</p>}

                                <Field orientation="horizontal">
                                    <Button type="button" variant="outline" onClick={onClose}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">Save</Button>
                                </Field>
                            </FieldGroup>
                        </form>

                        <div className="flex flex-col gap-3 px-4">
                            <h3 className="text-sm font-medium">Participants</h3>

                            {lesson.participants.length === 0 && (
                                <p className="text-sm text-muted-foreground">No participants yet.</p>
                            )}

                            {lesson.participants.map((participant) => (
                                <div key={participant.id} className="flex items-center justify-between gap-2">
                                    <span className="text-sm">
                                        {participant.student
                                            ? `${participant.student.first_name} ${participant.student.last_name}`
                                            : "Unknown student"}
                                    </span>
                                    <form action={handleRemoveParticipant}>
                                        <input type="hidden" name="id" value={participant.id} />
                                        <Button type="submit" variant="ghost" size="xs">
                                            Remove
                                        </Button>
                                    </form>
                                </div>
                            ))}

                            {availableStudents.length > 0 && (
                                <form action={handleAddParticipant} className="flex items-center gap-2">
                                    <input type="hidden" name="lesson_id" value={lesson.id} />
                                    <Select name="student_id" required>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Add a student" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableStudents.map((student) => (
                                                <SelectItem key={student.id} value={student.id.toString()}>
                                                    {student.first_name} {student.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="submit" variant="outline">
                                        Add
                                    </Button>
                                </form>
                            )}

                            {participantError && <p className="text-sm text-destructive">{participantError}</p>}
                        </div>

                        <SheetFooter>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">Delete lesson</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete this lesson?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. All participant records for this lesson will also be removed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <form action={handleDelete}>
                                            <input type="hidden" name="id" value={lesson.id} />
                                            <AlertDialogAction asChild>
                                                <button type="submit">Delete</button>
                                            </AlertDialogAction>
                                        </form>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </SheetFooter>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
