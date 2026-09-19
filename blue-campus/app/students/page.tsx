import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { StudentsTable } from "./columns"

async function getData(activeSchoolId: number | null){
  const supabase = await createClient();
  let query = supabase.from("students").select("*");
  if (activeSchoolId) query = query.eq("school_id", activeSchoolId);
  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  const studentIds = data.map((student) => student.id);
  const [registrationCounts, participantCounts, transactionCounts] = await Promise.all([
    countRelated("registrations", "student_id", studentIds),
    countRelated("lesson_participants", "student_id", studentIds),
    countRelated("transactions", "student_id", studentIds),
  ]);

  return data.map((student) => {
    const registrations = registrationCounts.get(student.id) ?? 0;
    const lessons = participantCounts.get(student.id) ?? 0;
    const transactions = transactionCounts.get(student.id) ?? 0;

    return {
      ...student,
      _relations: [
        ...(registrations
          ? [{ label: `${registrations} registration${registrations > 1 ? "s" : ""}`, href: "/registrations" }]
          : []),
        ...(lessons ? [{ label: `${lessons} lesson${lessons > 1 ? "s" : ""}`, href: "/lessons" }] : []),
        ...(transactions
          ? [{ label: `${transactions} transaction${transactions > 1 ? "s" : ""}`, href: "/transactions" }]
          : []),
      ],
    };
  });
}

export default async function StudentPage() {
  const profile = await getCurrentProfile();
  const canWrite =
    profile?.role === "admin" || profile?.role === "school" || profile?.role === "instructor";
  const data = await getData(profile?.activeSchoolId ?? null)

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={GraduationCap} title="Students">
        {canWrite && (
          <Button asChild>
            <Link href="/students/new-student">New student</Link>
          </Button>
        )}
      </PageHeader>
      <StudentsTable role={profile?.role ?? "student"} data={data} />
    </div>
  )
}