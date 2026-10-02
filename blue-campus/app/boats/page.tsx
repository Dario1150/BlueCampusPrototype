import Link from "next/link";
import { Anchor } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { getUsableBoatsFilter } from "@/lib/boats";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { BoatsTable } from "./columns"
import AddSharedBoatDialog from "./components/AddSharedBoatDialog"

type SharedBoatRow = { shared_boat_id: number; owner_school_id: number; owner_name: string }
type ShareDetailRow = { detail_boat_id: number; detail_school_id: number; detail_school_name: string }

async function getData(activeSchoolId: number | null){
  const supabase = await createClient();

  // Own boats plus any boats other schools have shared with this school.
  let query = supabase.from("boats").select("*");
  const scope = await getUsableBoatsFilter(supabase, activeSchoolId);
  if (scope) query = query.or(scope);
  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  const boatIds = data.map((boat) => boat.id);
  const [lessonCounts, codesResult, sharedBoatsResult, shareDetailsResult] = await Promise.all([
    countRelated("lessons", "boat_id", boatIds),
    // RLS only returns codes for boats the viewer owns (or everything for admin).
    supabase.from("boat_share_codes").select("boat_id, code"),
    supabase.rpc("my_shared_boats", { p_school_id: activeSchoolId }),
    supabase.rpc("boat_share_details", { p_owner_school_id: activeSchoolId }),
  ]);

  const codes = new Map<number, string>(
    (codesResult.data ?? []).map((row: { boat_id: number; code: string }) => [row.boat_id, row.code])
  );
  const sharedFrom = new Map<number, string>(
    ((sharedBoatsResult.data ?? []) as SharedBoatRow[]).map((row) => [row.shared_boat_id, row.owner_name])
  );
  const sharedWith = new Map<number, { school_id: number; name: string }[]>();
  for (const row of (shareDetailsResult.data ?? []) as ShareDetailRow[]) {
    const list = sharedWith.get(row.detail_boat_id) ?? [];
    list.push({ school_id: row.detail_school_id, name: row.detail_school_name });
    sharedWith.set(row.detail_boat_id, list);
  }

  return data.map((boat) => {
    const lessons = lessonCounts.get(boat.id) ?? 0;
    const sharedCount = sharedWith.get(boat.id)?.length ?? 0;
    const ownerName = sharedFrom.get(boat.id);

    return {
      ...boat,
      share_code: codes.get(boat.id) ?? null,
      shared_with: sharedWith.get(boat.id) ?? [],
      shared_from: ownerName ? { owner_name: ownerName, borrower_school_id: activeSchoolId } : null,
      _relations: [
        ...(lessons
          ? [{ label: `${lessons} lesson${lessons > 1 ? "s" : ""}`, href: "/lessons" }]
          : []),
        ...(sharedCount
          ? [{ label: `Shared with ${sharedCount} school${sharedCount > 1 ? "s" : ""}`, href: "/boats" }]
          : []),
      ],
    };
  });
}

export default async function BoatPage() {
  const profile = await getCurrentProfile();
  const canWrite = profile?.role === "admin" || profile?.role === "school";
  const data = await getData(profile?.activeSchoolId ?? null)

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={Anchor} title="Boats">
        {canWrite && (
          <div className="flex items-center gap-2">
            <AddSharedBoatDialog />
            <Button asChild>
              <Link href="/boats/new-boat">New boat</Link>
            </Button>
          </div>
        )}
      </PageHeader>
      <BoatsTable role={profile?.role ?? "student"} data={data} />
    </div>
  )
}
