import Link from "next/link";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(){
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instructors")
    .select("*");

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
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={Users} title="Instructors">
        <Button asChild>
          <Link href="/instructors/new-instructor">New instructor</Link>
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={data} />
    </div>
  )
}