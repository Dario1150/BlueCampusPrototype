"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Field, FieldLabel } from "@/components/ui/field"
import { updateSkillTracking } from "../actions"

type SkillTracking = {
    id: number
    status: string | null
    description: string | null
    skill: { id: number; skill_name: string } | null
}

type Props = {
    skills: SkillTracking[]
}

const STATUSES = ["Beginner", "Practicing", "Expert"]

export default function SkillTrackingList({ skills }: Props) {
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        await updateSkillTracking(formData)
        router.refresh()
    }

    return (
        <div className="w-full max-w-sm">
            <h2 className="font-heading text-lg font-semibold pb-3">Skills</h2>

            {skills.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No tracked skills for this registration yet.
                </p>
            )}

            <div className="flex flex-col gap-4">
                {skills.map((entry) => (
                    <form
                        key={entry.id}
                        action={handleSubmit}
                        className="flex flex-col gap-3 rounded-lg border p-3"
                    >
                        <input type="hidden" name="id" value={entry.id} />

                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                                {entry.skill?.skill_name ?? "Unknown skill"}
                            </span>

                            <Select name="status" defaultValue={entry.status ?? "Beginner"}>
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUSES.map((status) => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Field>
                            <FieldLabel htmlFor={`description-${entry.id}`}>Notes</FieldLabel>
                            <Textarea
                                id={`description-${entry.id}`}
                                name="description"
                                defaultValue={entry.description ?? ""}
                            />
                        </Field>

                        <Button type="submit" variant="outline" size="sm" className="self-end">
                            Save
                        </Button>
                    </form>
                ))}
            </div>
        </div>
    )
}
