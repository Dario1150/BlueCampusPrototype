import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { InstructorsTable } from "./columns"

async function getData(activeSchoolId: number | null){
  const supabase = await createClient();
  let query = supabase.from("instructors").select("*");
  if (activeSchoolId) query = query.eq("school_id", activeSchoolId);
  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  const instructorIds = data.map((instructor) => instructor.id);
  const [lessonCounts, transactionCounts] = await Promise.all([
    countRelated("lessons", "instructor_id", instructorIds),
    countRelated("transactions", "instructor_id", instructorIds),
  ]);

  return data.map((instructor) => {
    const lessons = lessonCounts.get(instructor.id) ?? 0;
    const transactions = transactionCounts.get(instructor.id) ?? 0;

    return {
      ...instructor,
      _relations: [
        ...(lessons ? [{ label: `${lessons} lesson${lessons > 1 ? "s" : ""}`, href: "/lessons" }] : []),
        ...(transactions
          ? [{ label: `${transactions} transaction${transactions > 1 ? "s" : ""}`, href: "/transactions" }]
          : []),
      ],
    };
  });
}

export default async function InstructorPage() {
  const profile = await getCurrentProfile();
  const canWrite = profile?.role === "admin" || profile?.role === "school";
  const data = await getData(profile?.activeSchoolId ?? null)

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={Users} title="Instructors">
        {canWrite && (
          <Button asChild>
            <Link href="/instructors/new-instructor">New instructor</Link>
          </Button>
        )}
      </PageHeader>
      <InstructorsTable role={profile?.role ?? "student"} data={data} />
    </div>
  )
}