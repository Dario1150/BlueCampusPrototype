import LessonsBoard from "./components/LessonsBoard";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";

type SkillTrackingRow = {
  id: number
  student_registration: number
  status: string | null
  description: string | null
  skill: { id: number; skill_name: string } | null
}

async function getLessons(activeSchoolId: number | null) {
  const supabase = await createClient();
  let query = supabase
    .from("lessons")
    .select(
      `*,
      course:courses(id, name),
      instructor:instructors(id, first_name, last_name),
      boat:boats(id, name),
      participants:lesson_participants(id, student:students(id, first_name, last_name, phone)),
      payments:transactions(id, student_id, amount, type, status)`
    )
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (activeSchoolId) query = query.eq("school_id", activeSchoolId);
  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

async function getOptions(activeSchoolId: number | null) {
  const supabase = await createClient();
  let instructorsQuery = supabase.from("instructors").select("id, first_name, last_name");
  let boatsQuery = supabase.from("boats").select("id, name");
  let coursesQuery = supabase.from("courses").select("id, name");
  let studentsQuery = supabase.from("students").select("id, first_name, last_name");
  let registrationsQuery = supabase.from("registrations").select("id, student_id, course_id");
  if (activeSchoolId) {
    instructorsQuery = instructorsQuery.eq("school_id", activeSchoolId);
    boatsQuery = boatsQuery.eq("school_id", activeSchoolId);
    coursesQuery = coursesQuery.eq("school_id", activeSchoolId);
    studentsQuery = studentsQuery.eq("school_id", activeSchoolId);
    registrationsQuery = registrationsQuery.eq("school_id", activeSchoolId);
  }

  const [
    { data: instructors },
    { data: boats },
    { data: courses },
    { data: students },
    { data: registrations },
    { data: skillTracking },
  ] = await Promise.all([
    instructorsQuery,
    boatsQuery,
    coursesQuery,
    studentsQuery,
    registrationsQuery,
    supabase
      .from("skill_tracking")
      .select("id, student_registration, status, description, skill:skills(id, skill_name)")
      .returns<SkillTrackingRow[]>(),
  ]);

  return {
    instructors: instructors ?? [],
    boats: boats ?? [],
    courses: courses ?? [],
    students: students ?? [],
    registrations: registrations ?? [],
    skillTracking: skillTracking ?? [],
  };
}

export default async function LessonPage() {
  const profile = await getCurrentProfile();
  const activeSchoolId = profile?.activeSchoolId ?? null;
  const [lessons, options] = await Promise.all([
    getLessons(activeSchoolId),
    getOptions(activeSchoolId),
  ]);
  const canWrite =
    profile?.role === "admin" || profile?.role === "school" || profile?.role === "instructor";

  return (
    <div className="container mx-auto py-10">
      <LessonsBoard lessons={lessons} options={options} canWrite={canWrite} />
    </div>
  );
}
