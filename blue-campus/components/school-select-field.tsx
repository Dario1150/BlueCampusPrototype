"use client"

import { Field, FieldLabel } from "@/components/ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Props = {
    schools: { id: number; name: string }[]
    defaultValue?: number | string | null
}

// Only rendered for admins — a school-scoped user's own school is always
// forced server-side (see effectiveSchoolId in lib/auth/current-profile.ts),
// so they never need or see this field.
export default function SchoolSelectField({ schools, defaultValue }: Props) {
    return (
        <Field>
            <FieldLabel htmlFor="form-school_id">School</FieldLabel>
            <Select name="school_id" defaultValue={defaultValue?.toString()} required>
                <SelectTrigger id="form-school_id" className="w-full">
                    <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                    {schools.map((school) => (
                        <SelectItem key={school.id} value={school.id.toString()}>
                            {school.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    )
}
