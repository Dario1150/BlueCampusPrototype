"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createSingleLesson } from "../actions";
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Options = {
    courses: { id: number; name: string }[]
    boats: { id: number; name: string }[]
    instructors: { id: number; first_name: string; last_name: string }[]
    students: { id: number; first_name: string; last_name: string }[]
    registrations: { id: number; student_id: number; course_id: number }[]
}

type Props = {
    options: Options
}

export default function SingleLessonForm({ options }: Props) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [courseId, setCourseId] = useState<string>("")

    const registeredStudentIds = new Set(
        options.registrations
            .filter((registration) => registration.course_id === Number(courseId))
            .map((registration) => registration.student_id)
    )
    const availableStudents = courseId
        ? options.students.filter((student) => registeredStudentIds.has(student.id))
        : []

    async function handleSubmit(formData: FormData) {
        setError(null)
        try {
            await createSingleLesson(formData)
            router.push("/lessons")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create the lesson.")
        }
    }

    return (
        <div className="content-center justify-items-center py-10">
            <form action={handleSubmit} className="w-full max-w-sm">
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="course_id">Course</FieldLabel>
                        <Select name="course_id" value={courseId} onValueChange={setCourseId} required>
                            <SelectTrigger id="course_id" className="w-full">
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

                    <Field>
                        <FieldLabel htmlFor="date">Date</FieldLabel>
                        <Input type="date" id="date" name="date" required />
                    </Field>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel htmlFor="start_time">Start</FieldLabel>
                            <Input type="time" id="start_time" name="start_time" required />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="end_time">End</FieldLabel>
                            <Input type="time" id="end_time" name="end_time" required />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Field>
                            <FieldLabel htmlFor="boat_id">Boat</FieldLabel>
                            <Select name="boat_id" required>
                                <SelectTrigger id="boat_id" className="w-full">
                                    <SelectValue placeholder="Select a boat" />
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

                        <Field>
                            <FieldLabel htmlFor="instructor_id">Instructor</FieldLabel>
                            <Select name="instructor_id">
                                <SelectTrigger id="instructor_id" className="w-full">
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
                    </div>

                    <Field>
                        <FieldLabel>Participants</FieldLabel>
                        <div className="flex flex-col gap-2 rounded-lg border p-3">
                            {!courseId && (
                                <p className="text-sm text-muted-foreground">Select a course to see registered students.</p>
                            )}
                            {courseId && availableStudents.length === 0 && (
                                <p className="text-sm text-muted-foreground">No students registered for this course yet.</p>
                            )}
                            {availableStudents.map((student) => (
                                <label key={student.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox name="student_ids" value={student.id.toString()} />
                                    {student.first_name} {student.last_name}
                                </label>
                            ))}
                        </div>
                    </Field>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit">Create</Button>
                </FieldGroup>
            </form>
        </div>
    );
}
