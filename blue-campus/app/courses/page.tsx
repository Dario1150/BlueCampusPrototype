import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { CoursesTable } from "./columns"

async function getData(activeSchoolId: number | null){
  const supabase = await createClient();
  let query = supabase.from("courses").select("*");
  if (activeSchoolId) query = query.eq("school_id", activeSchoolId);
  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  const courseIds = data.map((course) => course.id);
  const [lessonCounts, registrationCounts] = await Promise.all([
    countRelated("lessons", "course_id", courseIds),
    countRelated("registrations", "course_id", courseIds),
  ]);

  return data.map((course) => {
    const lessons = lessonCounts.get(course.id) ?? 0;
    const registrations = registrationCounts.get(course.id) ?? 0;

    return {
      ...course,
      _relations: [
        ...(lessons ? [{ label: `${lessons} lesson${lessons > 1 ? "s" : ""}`, href: "/lessons" }] : []),
        ...(registrations
          ? [{ label: `${registrations} registration${registrations > 1 ? "s" : ""}`, href: "/registrations" }]
          : []),
      ],
    };
  });
}

export default async function CoursePage() {
  const profile = await getCurrentProfile();
  const canWrite = profile?.role === "admin" || profile?.role === "school";
  const data = await getData(profile?.activeSchoolId ?? null)

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={BookOpen} title="Courses">
        {canWrite && (
          <Button asChild>
            <Link href="/courses/new-course">New course</Link>
          </Button>
        )}
      </PageHeader>
      <CoursesTable role={profile?.role ?? "student"} data={data} />
    </div>
  )
}