import LessonsBoard from "./components/LessonsBoard";
import { createClient } from "@/lib/supabase/server";

type SkillTrackingRow = {
  id: number
  student_registration: number
  status: string | null
  description: string | null
  skill: { id: number; skill_name: string } | null
}

async function getLessons() {
  const supabase = await createClient();
  const { data, error } = await supabase
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

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

async function getOptions() {
  const supabase = await createClient();
  const [
    { data: instructors },
    { data: boats },
    { data: courses },
    { data: students },
    { data: registrations },
    { data: skillTracking },
  ] = await Promise.all([
    supabase.from("instructors").select("id, first_name, last_name"),
    supabase.from("boats").select("id, name"),
    supabase.from("courses").select("id, name"),
    supabase.from("students").select("id, first_name, last_name"),
    supabase.from("registrations").select("id, student_id, course_id"),
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
  const [lessons, options] = await Promise.all([getLessons(), getOptions()]);

  return (
    <div className="container mx-auto py-10">
      <LessonsBoard lessons={lessons} options={options} />
    </div>
  );
}
