import { createClient } from "@/lib/supabase/server"
import InputForm from "../components/InputForm"

async function getOptions() {
    const supabase = await createClient();
    const [{ data: students }, { data: courses }, { data: skillSets }] = await Promise.all([
        supabase.from("students").select("id, first_name, last_name"),
        supabase.from("courses").select("id, name"),
        supabase.from("skill_sets").select("id, skill_set_title, course_id"),
    ])

    return {
        students: students ?? [],
        courses: courses ?? [],
        skillSets: skillSets ?? [],
    }
}

export default async function NewRegistrationPage() {
    const { students, courses, skillSets } = await getOptions()

    return <InputForm students={students} courses={courses} skillSets={skillSets} />
}
