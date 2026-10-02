import { redirect } from "next/navigation"
import NewLessonTabs from "../components/NewLessonTabs"
import { createClient } from "@/lib/supabase/server"
import { getCurrentProfile } from "@/lib/auth/current-profile"
import { getUsableBoatsFilter } from "@/lib/boats"

async function getOptions(activeSchoolId: number | null) {
    const supabase = await createClient();
    let boatsQuery = supabase.from("boats").select("id, name");
    let coursesQuery = supabase.from("courses").select("id, name");
    let instructorsQuery = supabase.from("instructors").select("id, first_name, last_name");
    let studentsQuery = supabase.from("students").select("id, first_name, last_name");
    let registrationsQuery = supabase.from("registrations").select("id, student_id, course_id");
    if (activeSchoolId) {
        coursesQuery = coursesQuery.eq("school_id", activeSchoolId);
        instructorsQuery = instructorsQuery.eq("school_id", activeSchoolId);
        studentsQuery = studentsQuery.eq("school_id", activeSchoolId);
        registrationsQuery = registrationsQuery.eq("school_id", activeSchoolId);
    }
    // Own boats plus boats other schools have shared with this school.
    const boatScope = await getUsableBoatsFilter(supabase, activeSchoolId);
    if (boatScope) boatsQuery = boatsQuery.or(boatScope);

    const [{ data: templateGroups }, { data: boats }, { data: courses }, { data: instructors }, { data: students }, { data: registrations }] = await Promise.all([
        supabase.from("templates").select("id, name").order("name"),
        boatsQuery,
        coursesQuery,
        instructorsQuery,
        studentsQuery,
        registrationsQuery,
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
    const profile = await getCurrentProfile();
    const canWrite =
        profile?.role === "admin" || profile?.role === "school" || profile?.role === "instructor";
    if (!canWrite) redirect("/lessons");

    const options = await getOptions(profile?.activeSchoolId ?? null)

    return <NewLessonTabs options={options} />
}
