import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import InputForm from "@/app/registrations/components/InputForm";
import SkillTrackingList from "@/app/registrations/components/SkillTrackingList";

type SkillTrackingRow = {
    id: number
    status: string | null
    description: string | null
    skill: { id: number; skill_name: string } | null
}

async function getOptions(activeSchoolId: number | null) {
    const supabase = await createClient();
    let studentsQuery = supabase.from("students").select("id, first_name, last_name");
    let coursesQuery = supabase.from("courses").select("id, name");
    if (activeSchoolId) {
        studentsQuery = studentsQuery.eq("school_id", activeSchoolId);
        coursesQuery = coursesQuery.eq("school_id", activeSchoolId);
    }

    const [{ data: students }, { data: courses }] = await Promise.all([studentsQuery, coursesQuery])

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
    const profile = await getCurrentProfile();

    const [{ data: registration }, { students, courses }, { data: skillTracking }] = await Promise.all([
        supabase
            .from("registrations")
            .select("*")
            .eq("id", id)
            .single(),
        getOptions(profile?.activeSchoolId ?? null),
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
