import Link from "next/link";
import { Anchor } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { BoatsTable } from "./columns"

async function getData(){
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("boats")
    .select("*");

  if (error) {
    console.error(error);
    return [];
  }

  const boatIds = data.map((boat) => boat.id);
  const lessonCounts = await countRelated("lessons", "boat_id", boatIds);

  return data.map((boat) => ({
    ...boat,
    _relations: [
      ...(lessonCounts.get(boat.id)
        ? [{ label: `${lessonCounts.get(boat.id)} lesson${lessonCounts.get(boat.id)! > 1 ? "s" : ""}`, href: "/lessons" }]
        : []),
    ],
  }));
}

export default async function BoatPage() {
  const profile = await getCurrentProfile();
  const canWrite = profile?.role === "admin" || profile?.role === "school";
  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={Anchor} title="Boats">
        {canWrite && (
          <Button asChild>
            <Link href="/boats/new-boat">New boat</Link>
          </Button>
        )}
      </PageHeader>
      <BoatsTable role={profile?.role ?? "student"} data={data} />
    </div>
  )
}