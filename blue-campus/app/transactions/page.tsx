import Link from "next/link";
import { Receipt } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { TransactionsTable } from "./columns"

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
  const profile = await getCurrentProfile();
  const canWrite =
    profile?.role === "admin" || profile?.role === "school" || profile?.role === "instructor";
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={Receipt} title="Transactions">
        {canWrite && (
          <Button asChild>
            <Link href="/transactions/new-transaction">New transaction</Link>
          </Button>
        )}
      </PageHeader>
      <TransactionsTable role={profile?.role ?? "student"} data={data} />
    </div>
  )
}
