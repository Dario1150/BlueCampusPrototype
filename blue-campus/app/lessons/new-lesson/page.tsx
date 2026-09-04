import NewLessonTabs from "../components/NewLessonTabs"
import { createClient } from "@/lib/supabase/server"

async function getOptions() {
    const supabase = await createClient();
    const [{ data: templateGroups }, { data: boats }, { data: courses }, { data: instructors }, { data: students }, { data: registrations }] = await Promise.all([
        supabase.from("templates").select("id, name").order("name"),
        supabase.from("boats").select("id, name"),
        supabase.from("courses").select("id, name"),
        supabase.from("instructors").select("id, first_name, last_name"),
        supabase.from("students").select("id, first_name, last_name"),
        supabase.from("registrations").select("id, student_id, course_id"),
    ])

    return {
        templateGroups: templateGroups ?? [],
        boats: boats ?? [],
        courses: courses ?? [],
        instructors: instructors ?? [],
        students: students ?? [],
        registrations: registrations ?? [],
    }
}

export default async function NewLessonPage() {
    const options = await getOptions()

    return <NewLessonTabs options={options} />
}
