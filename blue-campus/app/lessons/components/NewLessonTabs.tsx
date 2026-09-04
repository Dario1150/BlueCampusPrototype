"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import LessonForm from "./newLessonForm"
import SingleLessonForm from "./SingleLessonForm"

type Options = {
    templateGroups: { id: number; name: string }[]
    boats: { id: number; name: string }[]
    courses: { id: number; name: string }[]
    instructors: { id: number; first_name: string; last_name: string }[]
    students: { id: number; first_name: string; last_name: string }[]
    registrations: { id: number; student_id: number; course_id: number }[]
}

type Props = {
    options: Options
}

const TABS = [
    { id: "single", label: "Single Lesson" },
    { id: "template", label: "From Template" },
] as const

type Tab = (typeof TABS)[number]["id"]

export default function NewLessonTabs({ options }: Props) {
    const [tab, setTab] = useState<Tab>("single")

    return (
        <div className="container mx-auto flex flex-col py-10">
            <Link href="/lessons" className="mb-4 text-sm text-primary underline-offset-4 hover:underline">
                ← Back to lessons
            </Link>

            <div className="mx-auto flex gap-1 rounded-lg border p-1">
                {TABS.map(({ id, label }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cn(
                            "rounded-md px-3 py-1.5 text-sm transition-colors",
                            tab === id
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {tab === "template" ? (
                <LessonForm options={options} />
            ) : (
                <SingleLessonForm options={options} />
            )}
        </div>
    )
}
