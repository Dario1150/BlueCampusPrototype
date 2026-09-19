import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth/current-profile"
import InputForm from "../components/InputForm"

async function getOptions(activeSchoolId: number | null) {
    const supabase = await createClient();
    let studentsQuery = supabase.from("students").select("id, first_name, last_name");
    let coursesQuery = supabase.from("courses").select("id, name");
    if (activeSchoolId) {
        studentsQuery = studentsQuery.eq("school_id", activeSchoolId);
        coursesQuery = coursesQuery.eq("school_id", activeSchoolId);
    }

    const [{ data: students }, { data: courses }, { data: skillSets }] = await Promise.all([
        studentsQuery,
        coursesQuery,
        supabase.from("skill_sets").select("id, skill_set_title, course_id"),
    ])

    return {
        students: students ?? [],
        courses: courses ?? [],
        skillSets: skillSets ?? [],
    }
}

export default async function NewRegistrationPage() {
    const profile = await getCurrentProfile();
    const { students, courses, skillSets } = await getOptions(profile?.activeSchoolId ?? null)

    return <InputForm students={students} courses={courses} skillSets={skillSets} />
}
