import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SkillTrackingList from "@/app/registrations/components/SkillTrackingList";

type SkillTrackingRow = {
    id: number
    status: string | null
    description: string | null
    skill: { id: number; skill_name: string } | null
}

type RegistrationRow = {
    id: number
    student: { first_name: string; last_name: string } | null
    course: { name: string } | null
}

export default async function RegistrationSkillsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();

    const [{ data: registration }, { data: skillTracking }] = await Promise.all([
        supabase
            .from("registrations")
            .select("id, student:students(first_name, last_name), course:courses(name)")
            .eq("id", id)
            .single()
            .returns<RegistrationRow>(),
        supabase
            .from("skill_tracking")
            .select("id, status, description, skill:skills(id, skill_name)")
            .eq("student_registration", id)
            .returns<SkillTrackingRow[]>(),
    ])

    return (
        <div className="container mx-auto py-10">
            <div className="mx-auto w-full max-w-sm">
                <Link href="/registrations" className="text-sm text-primary underline-offset-4 hover:underline">
                    ← Back to registrations
                </Link>

                <h1 className="font-heading pt-3 pb-1 text-2xl font-bold">
                    {registration?.student
                        ? `${registration.student.first_name} ${registration.student.last_name}`
                        : "Unknown student"}
                </h1>
                <p className="pb-5 text-sm text-muted-foreground">
                    {registration?.course?.name ?? "Unknown course"}
                </p>

                <SkillTrackingList skills={skillTracking ?? []} />
            </div>
        </div>
    )
}
