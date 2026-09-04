import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(){
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*");

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
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={GraduationCap} title="Students">
        <Button asChild>
          <Link href="/students/new-student">New student</Link>
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={data} />
    </div>
  )
}