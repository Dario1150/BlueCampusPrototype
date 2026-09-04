import { createClient } from "@/lib/supabase/server";
import PerformanceBoard from "./PerformanceBoard";

export default async function PerformancePage() {
    const supabase = await createClient();
    const [
        { data: courses },
        { data: registrations },
        { data: lessons },
        { data: transactions },
        { data: instructors },
        { data: boats },
    ] = await Promise.all([
        supabase.from("courses").select("id, name"),
        supabase.from("registrations").select("id, course_id, status, registration_date"),
        supabase.from("lessons").select("id, course_id, instructor_id, boat_id, date, status"),
        supabase
            .from("transactions")
            .select("id, category, amount, date, instructor_id, lesson_id, registration_id, boat_id"),
        supabase.from("instructors").select("id, first_name, last_name"),
        supabase.from("boats").select("id, name"),
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
