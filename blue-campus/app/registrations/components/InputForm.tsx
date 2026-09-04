"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    createRegistration,
    updateRegistration
} from "../actions";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Registration = {
  id: string
  student_id: string
  course_id: string
  registration_date: string
  status: string
}

type Option = { id: number; name?: string; first_name?: string; last_name?: string }
type SkillSet = { id: number; skill_set_title: string; course_id: number }

type Props = {
    registration?: Registration
    students: Option[]
    courses: Option[]
    skillSets?: SkillSet[]
}

const STATUSES = ["Active", "Completed", "Cancelled"]

export default function InputForm({ registration, students, courses, skillSets = [] }: Props) {
  const [courseId, setCourseId] = useState(registration?.course_id?.toString())

  const matchingSkillSets = useMemo(
    () => skillSets.filter((skillSet) => skillSet.course_id.toString() === courseId),
    [skillSets, courseId]
  )

  return (
    <div className="content-center justify-items-center py-10">
        <form
            action={registration ? updateRegistration : createRegistration}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
        >
            {registration && (
                <input
                    type="hidden"
                    name="id"
                    value={registration.id}
                />
            )}
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="form-student">Student</FieldLabel>
                    <Select name="student_id" defaultValue={registration?.student_id?.toString()} required>
                        <SelectTrigger id="form-student" className="w-full">
                            <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map((student) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                    {student.first_name} {student.last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                <Field>
                    <FieldLabel htmlFor="form-course">Course</FieldLabel>
                    <Select
                        name="course_id"
                        value={courseId}
                        onValueChange={setCourseId}
                        required
                    >
                        <SelectTrigger id="form-course" className="w-full">
                            <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                        <SelectContent>
                            {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                {!registration && matchingSkillSets.length > 0 && (
                    <Field>
                        <FieldLabel htmlFor="form-skill-set">Skill Template</FieldLabel>
                        <Select name="skill_set_id">
                            <SelectTrigger id="form-skill-set" className="w-full">
                                <SelectValue placeholder="No skill template (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {matchingSkillSets.map((skillSet) => (
                                    <SelectItem key={skillSet.id} value={skillSet.id.toString()}>
                                        {skillSet.skill_set_title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="form-registration-date">Registration Date</FieldLabel>
                        <Input
                            id="form-registration-date"
                            name="registration_date"
                            type="date"
                            defaultValue={registration?.registration_date}
                            required
                        />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="form-status">Status</FieldLabel>
                        <Select name="status" defaultValue={registration?.status ?? "Active"} required>
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
                </div>

                <Field orientation="horizontal">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/registrations">Cancel</Link>
                    </Button>
                    <Button type="submit">Submit</Button>
                </Field>
            </FieldGroup>
        </form>
    </div>
  )
}
