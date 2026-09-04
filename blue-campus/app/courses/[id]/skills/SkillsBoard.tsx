"use client"

import { useState } from "react"
import Link from "next/link"
import { ListChecks, MoreHorizontal, Plus } from "lucide-react"
import PageHeader from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import DeleteGuardDialog from "@/components/delete-guard-dialog"
import SkillFormDialog from "./SkillFormDialog"
import { deleteSkill } from "./actions"

type Skill = { id: number; skill_name: string; description: string | null }

type Props = {
    course: { id: number; name: string }
    skillSetId: number | null
    skills: Skill[]
}

export default function SkillsBoard({ course, skillSetId, skills }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null)

    return (
        <div className="container mx-auto py-10">
            <Link href="/courses" className="text-sm text-primary underline-offset-4 hover:underline">
                ← Back to courses
            </Link>

            <div className="pt-3">
                <PageHeader icon={ListChecks} title={course.name} subtitle="Skills">
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <Plus className="size-4" />
                        New skill
                    </Button>
                </PageHeader>
            </div>

            {skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    No skills yet. Add the first one to start tracking student progress in this course.
                </p>
            ) : (
                <div className="overflow-hidden rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-0">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {skills.map((skill) => (
                                <TableRow key={skill.id}>
                                    <TableCell className="font-medium whitespace-normal">
                                        {skill.skill_name}
                                    </TableCell>
                                    <TableCell className="whitespace-normal text-muted-foreground">
                                        {skill.description || "—"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    onSelect={(e) => {
                                                        e.preventDefault()
                                                        setEditingSkill(skill)
                                                    }}
                                                >
                                                    Edit
                                                </DropdownMenuItem>
                                                <DeleteGuardDialog
                                                    itemLabel={skill.skill_name}
                                                    id={skill.id}
                                                    relations={[]}
                                                    deleteAction={deleteSkill}
                                                />
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <SkillFormDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                courseId={course.id}
                courseName={course.name}
                skillSetId={skillSetId}
            />

            <SkillFormDialog
                open={!!editingSkill}
                onOpenChange={(open) => {
                    if (!open) setEditingSkill(null)
                }}
                courseId={course.id}
                courseName={course.name}
                skillSetId={skillSetId}
                skill={editingSkill ?? undefined}
            />
        </div>
    )
}
