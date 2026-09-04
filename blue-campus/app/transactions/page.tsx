import Link from "next/link";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { columns } from "./columns"
import { DataTable } from "./data-table"

async function getData(){
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, student:students(id, first_name, last_name), instructor:instructors(id, first_name, last_name), boat:boats(id, name)")
    .order("date", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export default async function TransactionPage() {
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={Receipt} title="Transactions">
        <Button asChild>
          <Link href="/transactions/new-transaction">New transaction</Link>
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={data} />
    </div>
  )
}
