"use client"

import { Button } from "@/components/ui/button"
import { 
    createStudent,
    updateStudent
} from "../actions";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import SchoolSelectField from "@/components/school-select-field"

type Student = {
    id: number
    first_name: string
    last_name: string
    email: string
    phone: string
    date_of_birth: string
    adress: string
    postal_code: string
    city: string
    country: string
    notes: string
    school_id: number
    created_at: string
    updated_at: string
}

type Props = {
    student?: Student
    schools?: { id: number; name: string }[]
    defaultSchoolId?: number
}

export default function InputForm({ student, schools, defaultSchoolId }: Props) {
  return (
    <div className="content-center justify-items-center">
        <form
            action={student ? updateStudent:createStudent}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
        >
            {student && (
                <input
                    type="hidden"
                    name="id"
                    value={student.id}
                />
            )}
            <FieldGroup>
                {schools && (
                    <SchoolSelectField schools={schools} defaultValue={student?.school_id ?? defaultSchoolId} />
                )}
                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="form-firstname">First Name</FieldLabel>
                        <Input
                            id="form-firstname"
                            name="first_name"
                            type="text"
                            defaultValue={student?.first_name}
                            placeholder="Max"
                            required
                        />
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="form-lastname">Last Name</FieldLabel>
                        <Input
                            id="form-lastname"
                            name="last_name"
                            type="text"
                            defaultValue={student?.last_name}
                            placeholder="Muster"
                            required
                        />
                    </Field>
                </div>
                <Field>
                    <FieldLabel htmlFor="form-date_of_birth">Date of Birth</FieldLabel>
                    <Input id="form-date_of_birth" name="date_of_birth" type="date" defaultValue={student?.date_of_birth} placeholder="11.12.1990" required/>
                </Field>
                <Field>
                    <FieldLabel htmlFor="form-phone">Phone</FieldLabel>
                    <Input id="form-phone" name="phone" type="tel" defaultValue={student?.phone} placeholder="+41 79 123 45 67" />
                </Field>
                <Field>
                    <FieldLabel htmlFor="form-email">Email</FieldLabel>
                    <Input id="form-email" name="email" type="email" defaultValue={student?.email} placeholder="max.muster@hotmail.com" required/>
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="form-canton">Postal Code</FieldLabel>
                        <Input id="form-postal_code" name="postal_code" type="text" defaultValue={student?.postal_code} placeholder="4132" required/>
                    </Field>
                    <Field>
                        <FieldLabel htmlFor="form-city">City</FieldLabel>
                        <Input id="form-city" name="city" type="text" defaultValue={student?.city} placeholder="Basel-Stadt" required/>
                    </Field>
                </div>
                <Field>
                        <FieldLabel htmlFor="form-adress">Adress</FieldLabel>
                        <Input id="form-adress" name="adress" type="text" defaultValue={student?.adress} placeholder="Gellertstrasse 21" required/>
                    </Field>
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
