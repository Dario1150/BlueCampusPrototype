"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
    createCourse,
    updateCourse
} from "../actions";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import SchoolSelectField from "@/components/school-select-field"

type Course = {
  id: string
  school_id: string
  name: string
  description: string
  category: string
  status: string
}

type Props = {
    course?: Course
    schools?: { id: number; name: string }[]
    defaultSchoolId?: number
}

export default function InputForm({ course, schools, defaultSchoolId }: Props) {
  return (
    <div className="content-center justify-items-center">
        <form
            action={course ? updateCourse:createCourse}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
        >
            {course && (
                <input
                    type="hidden"
                    name="id"
                    value={course.id}
                />
            )}
            <FieldGroup>
                {schools && (
                    <SchoolSelectField schools={schools} defaultValue={course?.school_id ?? defaultSchoolId} />
                )}
                <Field>
                    <FieldLabel htmlFor="form-name">Name</FieldLabel>
                    <Input
                        id="form-name"
                        name="name"
                        type="text"
                        defaultValue={course?.name}
                        placeholder="Sailing Exam Preparation"
                        required
                    />
                </Field>
                <Field>
                    <FieldLabel htmlFor="form-description">Description</FieldLabel>
                    <Textarea 
                        id="form-description"
                        name="description"
                        defaultValue={course?.description}
                        placeholder="Type your course description here:" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="category">Category</FieldLabel>
                        <Input id="form-category" name="category" type="text" defaultValue={course?.category} placeholder="Theory" required/>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="form-status">Status</FieldLabel>
                        <Input id="form-status" name="status" type="text" defaultValue={course?.status} placeholder="scheduled" />
                    </Field>
                </div>
                <Field orientation="horizontal">
                <Button type="button" variant="outline">
                    Cancel
                </Button>
                <Button type="submit">Submit</Button>
                </Field>
            </FieldGroup>
        </form>
    </div>
  )
}
