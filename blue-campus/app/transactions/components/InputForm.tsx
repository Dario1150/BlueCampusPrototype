"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    createTransaction,
    updateTransaction
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

type Transaction = {
  id: string
  student_id: string | null
  instructor_id: string | null
  registration_id: string | null
  boat_id: string | null
  date: string
  amount: number
  type: string
  category: string
  status: string | null
  description: string | null
}

type Option = { id: number; first_name?: string; last_name?: string }
type RegistrationOption = { id: number; label: string }
type BoatOption = { id: number; name: string }

type Props = {
    transaction?: Transaction
    students: Option[]
    instructors: Option[]
    registrations: RegistrationOption[]
    boats: BoatOption[]
}

const TYPES = ["Cash", "Card", "Twint", "Bank Transfer"]
const STATUSES = ["Paid", "Pending", "Refunded"]

const CATEGORIES = ["Lesson Fee", "Registration Fee", "Salary", "Gas", "Repair", "Other"] as const

const CATEGORY_CONFIG: Record<
    (typeof CATEGORIES)[number],
    {
        showStudent: boolean
        studentRequired: boolean
        showInstructor: boolean
        instructorRequired: boolean
        instructorLabel: string
        showRegistration: boolean
        showBoat: boolean
    }
> = {
    "Lesson Fee": {
        showStudent: true,
        studentRequired: true,
        showInstructor: true,
        instructorRequired: true,
        instructorLabel: "Received By",
        showRegistration: false,
        showBoat: false,
    },
    "Registration Fee": {
        showStudent: true,
        studentRequired: true,
        showInstructor: true,
        instructorRequired: false,
        instructorLabel: "Received By",
        showRegistration: true,
        showBoat: false,
    },
    Salary: {
        showStudent: false,
        studentRequired: false,
        showInstructor: true,
        instructorRequired: true,
        instructorLabel: "Instructor",
        showRegistration: false,
        showBoat: false,
    },
    Gas: {
        showStudent: false,
        studentRequired: false,
        showInstructor: true,
        instructorRequired: true,
        instructorLabel: "Paid By",
        showRegistration: false,
        showBoat: true,
    },
    Repair: {
        showStudent: false,
        studentRequired: false,
        showInstructor: true,
        instructorRequired: true,
        instructorLabel: "Paid By",
        showRegistration: false,
        showBoat: true,
    },
    Other: {
        showStudent: true,
        studentRequired: false,
        showInstructor: true,
        instructorRequired: false,
        instructorLabel: "Instructor",
        showRegistration: false,
        showBoat: true,
    },
}

export default function InputForm({ transaction, students, instructors, registrations, boats }: Props) {
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    (transaction?.category as (typeof CATEGORIES)[number]) ?? "Lesson Fee"
  )
  const config = CATEGORY_CONFIG[category]

  return (
    <div className="content-center justify-items-center py-10">
        <form
            action={transaction ? updateTransaction : createTransaction}
            className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm"
        >
            {transaction && (
                <input type="hidden" name="id" value={transaction.id} />
            )}
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="form-category">Category</FieldLabel>
                    <Select
                        name="category"
                        value={category}
                        onValueChange={(value) => setCategory(value as (typeof CATEGORIES)[number])}
                        required
                    >
                        <SelectTrigger id="form-category" className="w-full">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </Field>

                {config.showStudent && (
                    <Field>
                        <FieldLabel htmlFor="form-student">Student</FieldLabel>
                        <Select
                            name="student_id"
                            defaultValue={transaction?.student_id?.toString()}
                            required={config.studentRequired}
                        >
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
                )}

                {config.showRegistration && (
                    <Field>
                        <FieldLabel htmlFor="form-registration">Registration</FieldLabel>
                        <Select name="registration_id" defaultValue={transaction?.registration_id?.toString()}>
                            <SelectTrigger id="form-registration" className="w-full">
                                <SelectValue placeholder="Select a registration (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {registrations.map((registration) => (
                                    <SelectItem key={registration.id} value={registration.id.toString()}>
                                        {registration.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                )}

                {config.showBoat && (
                    <Field>
                        <FieldLabel htmlFor="form-boat">Boat</FieldLabel>
                        <Select name="boat_id" defaultValue={transaction?.boat_id?.toString()}>
                            <SelectTrigger id="form-boat" className="w-full">
                                <SelectValue placeholder="Select a boat (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {boats.map((boat) => (
                                    <SelectItem key={boat.id} value={boat.id.toString()}>
                                        {boat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                )}

                {config.showInstructor && (
                    <Field>
                        <FieldLabel htmlFor="form-instructor">{config.instructorLabel}</FieldLabel>
                        <Select
                            name="instructor_id"
                            defaultValue={transaction?.instructor_id?.toString()}
                            required={config.instructorRequired}
                        >
                            <SelectTrigger id="form-instructor" className="w-full">
                                <SelectValue placeholder="Select an instructor" />
                            </SelectTrigger>
                            <SelectContent>
                                {instructors.map((instructor) => (
                                    <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                        {instructor.first_name} {instructor.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="form-date">Date</FieldLabel>
                        <Input id="form-date" name="date" type="date" defaultValue={transaction?.date} required />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="form-amount">Amount</FieldLabel>
                        <Input id="form-amount" name="amount" type="number" step="0.01" defaultValue={transaction?.amount} placeholder="45.00" required />
                    </Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field>
                        <FieldLabel htmlFor="form-type">Payment Method</FieldLabel>
                        <Select name="type" defaultValue={transaction?.type} required>
                            <SelectTrigger id="form-type" className="w-full">
                                <SelectValue placeholder="Select a method" />
                            </SelectTrigger>
                            <SelectContent>
                                {TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="form-status">Status</FieldLabel>
                        <Select name="status" defaultValue={transaction?.status ?? "Paid"} required>
                            <SelectTrigger id="form-status" className="w-full">
                                <SelectValue placeholder="Select a status" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUSES.map((status) => (
                                    <SelectItem key={status} value={status}>{status}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>
                </div>

                <Field>
                    <FieldLabel htmlFor="form-description">Description</FieldLabel>
                    <Textarea id="form-description" name="description" defaultValue={transaction?.description ?? ""} />
                </Field>

                <Field orientation="horizontal">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/transactions">Cancel</Link>
                    </Button>
                    <Button type="submit">Submit</Button>
                </Field>
            </FieldGroup>
        </form>
    </div>
  )
}
