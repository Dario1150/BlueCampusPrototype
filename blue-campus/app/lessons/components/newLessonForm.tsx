"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createLessonsForDate } from "../actions";
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Options = {
    templateGroups: { id: number; name: string }[]
    boats: { id: number; name: string }[]
}

type Props = {
    options: Options
}

export default function LessonForm({ options }: Props) {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(formData: FormData) {
        setError(null)
        try {
            await createLessonsForDate(formData)
            router.push("/lessons")
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not create lessons.")
        }
    }

    return (
        <div className="content-center justify-items-center py-10">
            <form action={handleSubmit} className="w-full max-w-sm">
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="lesson_date">Date</FieldLabel>
                        <Input type="date" id="lesson_date" name="lesson_date" required />
                    </Field>

                    <Field>
                        <FieldLabel htmlFor="template_group_id">Template</FieldLabel>
                        <Select name="template_group_id" required>
                            <SelectTrigger id="template_group_id" className="w-full">
                                <SelectValue placeholder="Select a template" />
                            </SelectTrigger>
                            <SelectContent>
                                {options.templateGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.id.toString()}>
                                        {group.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </Field>

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

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit">Create</Button>
                </FieldGroup>
            </form>
        </div>
    );
}
