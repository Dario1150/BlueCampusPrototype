import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { RegistrationsTable } from "./columns"

async function getData(activeSchoolId: number | null){
  const supabase = await createClient();
  let query = supabase
    .from("registrations")
    .select("*, student:students(id, first_name, last_name), course:courses(id, name)")
    .order("registration_date", { ascending: false });
  if (activeSchoolId) query = query.eq("school_id", activeSchoolId);
  const { data, error } = await query;

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
  const profile = await getCurrentProfile();
  const canWrite = profile?.role === "admin" || profile?.role === "school";
  const data = await getData(profile?.activeSchoolId ?? null)

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={ClipboardList} title="Registrations">
        {canWrite && (
          <Button asChild>
            <Link href="/registrations/new-registration">New registration</Link>
          </Button>
        )}
      </PageHeader>
      <RegistrationsTable role={profile?.role ?? "student"} data={data} />
    </div>
  )
}
