"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog"
import { updateSkillTrackingBulk } from "@/app/registrations/actions"

type SkillEntry = {
    id: number
    status: string | null
    description: string | null
    skill: { id: number; skill_name: string } | null
}

type Props = {
    studentName: string
    skills: SkillEntry[]
}

const STATUSES = ["Beginner", "Practicing", "Expert"]
const STATUS_DOT: Record<string, string> = {
    Beginner: "bg-gray-400",
    Practicing: "bg-sky-500",
    Expert: "bg-emerald-500",
}

export default function ParticipantSkills({ studentName, skills }: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        await updateSkillTrackingBulk(formData)
        router.refresh()
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="xs" className="self-start">
                    <ListChecks className="size-3" />
                    Skills
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Update skills — {studentName}</DialogTitle>
                </DialogHeader>

                {skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No tracked skills for this registration yet.
                    </p>
                ) : (
                    <form action={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="hidden"
                            name="skill_tracking_ids"
                            value={skills.map((entry) => entry.id).join(",")}
                        />

                        {skills.map((entry) => (
                            <div key={entry.id} className="flex flex-col gap-2 rounded-lg border p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-sm font-medium">
                                        {entry.skill?.skill_name ?? "Unknown skill"}
                                    </span>
                                    <Select name={`status-${entry.id}`} defaultValue={entry.status ?? "Beginner"}>
                                        <SelectTrigger className="w-36">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map((status) => (
                                                <SelectItem key={status} value={status}>
                                                    <span className="flex items-center gap-2">
                                                        <span className={`size-1.5 rounded-full ${STATUS_DOT[status]}`} />
                                                        {status}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Textarea
                                    name={`description-${entry.id}`}
                                    defaultValue={entry.description ?? ""}
                                    placeholder="Notes"
                                />
                            </div>
                        ))}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save all</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
