import { createClient } from "@/lib/supabase/server";

function ids<T extends Record<string, unknown>>(rows: T[] | null, key: keyof T): number[] {
  return (rows ?? []).map((row) => row[key] as number);
}

/** Deletes a lesson along with its participants and any transactions tied to it. */
export async function cascadeDeleteLesson(lessonId: number) {
  const supabase = await createClient();
  await supabase.from("lesson_participants").delete().eq("lesson_id", lessonId);
  await supabase.from("transactions").delete().eq("lesson_id", lessonId);
  await supabase.from("lessons").delete().eq("id", lessonId);
}

/** Deletes a registration along with its tracked skills and any transactions tied to it. */
export async function cascadeDeleteRegistration(registrationId: number) {
  const supabase = await createClient();
  await supabase.from("skill_tracking").delete().eq("student_registration", registrationId);
  await supabase.from("transactions").delete().eq("registration_id", registrationId);
  await supabase.from("registrations").delete().eq("id", registrationId);
}

/** Deletes a course along with its lessons, registrations, and skill template. */
export async function cascadeDeleteCourse(courseId: number) {
  const supabase = await createClient();
  const { data: lessons } = await supabase.from("lessons").select("id").eq("course_id", courseId);
  for (const lessonId of ids(lessons, "id")) {
    await cascadeDeleteLesson(lessonId);
  }

  const { data: registrations } = await supabase
    .from("registrations")
    .select("id")
    .eq("course_id", courseId);
  for (const registrationId of ids(registrations, "id")) {
    await cascadeDeleteRegistration(registrationId);
  }

  const { data: skillSets } = await supabase.from("skill_sets").select("id").eq("course_id", courseId);
  for (const skillSetId of ids(skillSets, "id")) {
    const { data: skills } = await supabase.from("skills").select("id").eq("skill_set", skillSetId);
    for (const skillId of ids(skills, "id")) {
      await supabase.from("skill_tracking").delete().eq("skill", skillId);
    }
    await supabase.from("skills").delete().eq("skill_set", skillSetId);
  }
  await supabase.from("skill_sets").delete().eq("course_id", courseId);

  await supabase.from("courses").delete().eq("id", courseId);
}

/** Deletes an instructor along with the lessons they teach and payments they received. */
export async function cascadeDeleteInstructor(instructorId: number) {
  const supabase = await createClient();
  const { data: lessons } = await supabase.from("lessons").select("id").eq("instructor_id", instructorId);
  for (const lessonId of ids(lessons, "id")) {
    await cascadeDeleteLesson(lessonId);
  }

  await supabase.from("transactions").delete().eq("instructor_id", instructorId);
  await supabase.from("instructors").delete().eq("id", instructorId);
}

/** Deletes a boat along with the lessons it's assigned to. */
export async function cascadeDeleteBoat(boatId: number) {
  const supabase = await createClient();
  const { data: lessons } = await supabase.from("lessons").select("id").eq("boat_id", boatId);
  for (const lessonId of ids(lessons, "id")) {
    await cascadeDeleteLesson(lessonId);
  }

  await supabase.from("boats").delete().eq("id", boatId);
}

/** Deletes a student along with their registrations, lesson participation, and transactions. */
export async function cascadeDeleteStudent(studentId: number) {
  const supabase = await createClient();
  const { data: registrations } = await supabase
    .from("registrations")
    .select("id")
    .eq("student_id", studentId);
  for (const registrationId of ids(registrations, "id")) {
    await cascadeDeleteRegistration(registrationId);
  }

  await supabase.from("lesson_participants").delete().eq("student_id", studentId);
  await supabase.from("transactions").delete().eq("student_id", studentId);
  await supabase.from("students").delete().eq("id", studentId);
}

/** Deletes a skill along with any tracked progress recorded against it. */
export async function cascadeDeleteSkill(skillId: number) {
  const supabase = await createClient();
  await supabase.from("skill_tracking").delete().eq("skill", skillId);
  await supabase.from("skills").delete().eq("id", skillId);
}

/** Deletes a school along with every course, student, instructor, and boat that belongs to it. */
export async function cascadeDeleteSchool(schoolId: number) {
  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("id").eq("school_id", schoolId);
  for (const courseId of ids(courses, "id")) {
    await cascadeDeleteCourse(courseId);
  }

  const { data: students } = await supabase.from("students").select("id").eq("school_id", schoolId);
  for (const studentId of ids(students, "id")) {
    await cascadeDeleteStudent(studentId);
  }

  const { data: instructors } = await supabase.from("instructors").select("id").eq("school_id", schoolId);
  for (const instructorId of ids(instructors, "id")) {
    await cascadeDeleteInstructor(instructorId);
  }

  const { data: boats } = await supabase.from("boats").select("id").eq("school_id", schoolId);
  for (const boatId of ids(boats, "id")) {
    await cascadeDeleteBoat(boatId);
  }

  await supabase.from("schools").delete().eq("id", schoolId);
}

/** Counts rows in `table` grouped by `column`, for a given set of ids. */
export async function countRelated(
  table: string,
  column: string,
  targetIds: number[]
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (targetIds.length === 0) return counts;

  const supabase = await createClient();
  const { data } = await supabase.from(table).select(column).in(column, targetIds);

  for (const row of (data ?? []) as unknown as Record<string, number>[]) {
    const id = row[column];
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}
