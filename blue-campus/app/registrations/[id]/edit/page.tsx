import { createClient } from "@/lib/supabase/server";
import InputForm from "@/app/registrations/components/InputForm";
import SkillTrackingList from "@/app/registrations/components/SkillTrackingList";

type SkillTrackingRow = {
    id: number
    status: string | null
    description: string | null
    skill: { id: number; skill_name: string } | null
}

async function getOptions() {
    const supabase = await createClient();
    const [{ data: students }, { data: courses }] = await Promise.all([
        supabase.from("students").select("id, first_name, last_name"),
        supabase.from("courses").select("id, name"),
    ])

    return {
        students: students ?? [],
        courses: courses ?? [],
    }
}

export default async function EditRegistrationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();

    const [{ data: registration }, { students, courses }, { data: skillTracking }] = await Promise.all([
        supabase
            .from("registrations")
            .select("*")
            .eq("id", id)
            .single(),
        getOptions(),
        supabase
            .from("skill_tracking")
            .select("id, status, description, skill:skills(id, skill_name)")
            .eq("student_registration", id)
            .returns<SkillTrackingRow[]>(),
    ])

    return (
        <div className="flex flex-col gap-10">
            <InputForm registration={registration} students={students} courses={courses} />
            <div className="mx-auto w-full max-w-sm">
                <SkillTrackingList skills={skillTracking ?? []} />
            </div>
        </div>
    )
}
