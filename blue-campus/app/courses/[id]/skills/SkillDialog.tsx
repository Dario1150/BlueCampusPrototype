"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { createSkill, updateSkill } from "./actions"

type Skill = { id: number; skill_name: string; description: string | null }

type Props = {
    trigger: React.ReactNode
    courseId: number
    courseName: string
    skillSetId: number | null
    skill?: Skill
}

export default function SkillDialog({ trigger, courseId, courseName, skillSetId, skill }: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const isEditing = !!skill

    async function handleSubmit(formData: FormData) {
        setError(null)
        try {
            if (isEditing) {
                await updateSkill(formData)
            } else {
                await createSkill(formData)
            }
            router.refresh()
            setOpen(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save this skill.")
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                setOpen(next)
                if (!next) setError(null)
            }}
        >
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit skill" : "New skill"}</DialogTitle>
                </DialogHeader>

                <form action={handleSubmit} className="flex flex-col gap-4">
                    {isEditing && <input type="hidden" name="id" value={skill.id} />}
                    <input type="hidden" name="course_id" value={courseId} />
                    <input type="hidden" name="course_name" value={courseName} />
                    {skillSetId && <input type="hidden" name="skill_set_id" value={skillSetId} />}

                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="skill-name">Name</FieldLabel>
                            <Input
                                id="skill-name"
                                name="skill_name"
                                defaultValue={skill?.skill_name ?? ""}
                                placeholder="e.g. Anlegen"
                                required
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="skill-description">Description</FieldLabel>
                            <Textarea
                                id="skill-description"
                                name="description"
                                defaultValue={skill?.description ?? ""}
                                placeholder="What does mastering this skill look like?"
                            />
                        </Field>
                    </FieldGroup>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">{isEditing ? "Save" : "Add skill"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
