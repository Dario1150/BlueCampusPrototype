import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(){
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registrations")
    .select("*, student:students(id, first_name, last_name), course:courses(id, name)")
    .order("registration_date", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  const registrationIds = data.map((registration) => registration.id);
  const transactionCounts = await countRelated("transactions", "registration_id", registrationIds);

  return data.map((registration) => {
    const transactions = transactionCounts.get(registration.id) ?? 0;

    return {
      ...registration,
      _relations: [
        ...(transactions
          ? [{ label: `${transactions} transaction${transactions > 1 ? "s" : ""}`, href: "/transactions" }]
          : []),
      ],
    };
  });
}

export default async function RegistrationPage() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={ClipboardList} title="Registrations">
        <Button asChild>
          <Link href="/registrations/new-registration">New registration</Link>
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
