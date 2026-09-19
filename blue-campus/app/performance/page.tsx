import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import PerformanceBoard from "./PerformanceBoard";

export default async function PerformancePage() {
    const supabase = await createClient();
    const profile = await getCurrentProfile();
    const activeSchoolId = profile?.activeSchoolId ?? null;

    let coursesQuery = supabase.from("courses").select("id, name");
    let registrationsQuery = supabase.from("registrations").select("id, course_id, status, registration_date");
    let lessonsQuery = supabase.from("lessons").select("id, course_id, instructor_id, boat_id, date, status");
    let transactionsQuery = supabase
        .from("transactions")
        .select("id, category, amount, date, instructor_id, lesson_id, registration_id, boat_id");
    let instructorsQuery = supabase.from("instructors").select("id, first_name, last_name");
    let boatsQuery = supabase.from("boats").select("id, name");

    if (activeSchoolId) {
        coursesQuery = coursesQuery.eq("school_id", activeSchoolId);
        registrationsQuery = registrationsQuery.eq("school_id", activeSchoolId);
        lessonsQuery = lessonsQuery.eq("school_id", activeSchoolId);
        transactionsQuery = transactionsQuery.eq("school_id", activeSchoolId);
        instructorsQuery = instructorsQuery.eq("school_id", activeSchoolId);
        boatsQuery = boatsQuery.eq("school_id", activeSchoolId);
    }

    const [
        { data: courses },
        { data: registrations },
        { data: lessons },
        { data: transactions },
        { data: instructors },
        { data: boats },
    ] = await Promise.all([
        coursesQuery,
        registrationsQuery,
        lessonsQuery,
        transactionsQuery,
        instructorsQuery,
        boatsQuery,
    ]);

    return (
        <PerformanceBoard
            courses={courses ?? []}
            registrations={registrations ?? []}
            lessons={lessons ?? []}
            transactions={transactions ?? []}
            instructors={instructors ?? []}
            boats={boats ?? []}
        />
    );
}
