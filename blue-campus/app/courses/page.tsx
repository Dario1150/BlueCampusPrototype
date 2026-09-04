import Link from "next/link";
import { BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(){
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*");

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
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={BookOpen} title="Courses">
        <Button asChild>
          <Link href="/courses/new-course">New course</Link>
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={data} />
    </div>
  )
}