"use client"

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
import {
    updateLesson,
    deleteLesson,
    addParticipant,
    removeParticipant,
} from "../actions"
import ParticipantPayment from "./ParticipantPayment"
import ParticipantSkills from "./ParticipantSkills"
import BookNextLesson from "./BookNextLesson"

type Option = { id: number; name?: string; first_name?: string; last_name?: string }

type Lesson = {
    id: number
    course: { id: number; name: string } | null
    instructor: { id: number; first_name: string; last_name: string } | null
    boat: { id: number; name: string } | null
    participants: { id: number; student: { id: number; first_name: string; last_name: string } | null }[]
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
    lesson: Lesson | null
    options: Options
    onClose: () => void
}

const STATUSES = ["Open", "Scheduled", "Completed", "Cancelled"]

export default function LessonDetail({ lesson, options, onClose }: Props) {
    const router = useRouter()

    async function handleUpdate(formData: FormData) {
        await updateLesson(formData)
        router.refresh()
        onClose()
    }

    async function handleDelete(formData: FormData) {
        await deleteLesson(formData)
        router.refresh()
        onClose()
    }

    async function handleAddParticipant(formData: FormData) {
        await addParticipant(formData)
        router.refresh()
    }

    async function handleRemoveParticipant(formData: FormData) {
        await removeParticipant(formData)
        router.refresh()
    }

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

    function nextWeekDate(date: string) {
        const next = new Date(`${date}T00:00:00`)
        next.setDate(next.getDate() + 7)
        return next.toISOString().slice(0, 10)
    }

    const availableStudents = lesson
        ? options.students.filter(
              (student) =>
                  !lesson.participants.some((p) => p.student?.id === student.id)
          )
        : []

    return (
        <Sheet open={!!lesson} onOpenChange={(open) => !open && onClose()}>
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

                            {lesson.participants.map((participant) => {
                                const { hasRegistration, skills } = participant.student
                                    ? getSkillsForStudent(participant.student.id)
                                    : { hasRegistration: false, skills: [] as SkillTracking[] }

                                return (
                                    <div key={participant.id} className="flex flex-col gap-2 border-b pb-3 last:border-b-0">
                                        <div className="flex items-center justify-between gap-2">
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

                                        {participant.student && (
                                            <div className="flex items-start justify-between gap-2">
                                                <ParticipantPayment
                                                    lessonId={lesson.id}
                                                    lessonDate={lesson.date}
                                                    studentId={participant.student.id}
                                                    defaultInstructorId={lesson.instructor?.id}
                                                    payments={lesson.payments.filter(
                                                        (payment) => payment.student_id === participant.student!.id
                                                    )}
                                                    instructors={options.instructors}
                                                />
                                                {hasRegistration && (
                                                    <ParticipantSkills
                                                        studentName={`${participant.student.first_name} ${participant.student.last_name}`}
                                                        skills={skills}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {availableStudents.length > 0 && (
                                <form action={handleAddParticipant} className="flex items-center gap-2">
                                    <input type="hidden" name="lesson_id" value={lesson.id} />
                                    <Select name="student_id">
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
                        </div>

                        <div className="px-4">
                            <BookNextLesson
                                lessonId={lesson.id}
                                defaultDate={nextWeekDate(lesson.date)}
                                defaultStartTime={lesson.start_time?.slice(0, 5)}
                                defaultEndTime={lesson.end_time?.slice(0, 5)}
                            />
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
