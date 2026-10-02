import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * PostgREST `or(...)` filter matching every boat a school can use: its own
 * plus any boats other schools have shared with it. Returns null when no
 * school scope applies (e.g. admin viewing all schools).
 *
 * Plain `.eq("school_id", id)` would hide shared boats, so every boat list
 * and boat dropdown should use this instead.
 */
export async function getUsableBoatsFilter(
  supabase: SupabaseClient,
  schoolId: number | null
): Promise<string | null> {
  if (!schoolId) return null;

  const { data } = await supabase
    .from("boat_shares")
    .select("boat_id")
    .eq("school_id", schoolId);

  const sharedIds = (data ?? []).map((row) => row.boat_id as number);

  return sharedIds.length > 0
    ? `school_id.eq.${schoolId},id.in.(${sharedIds.join(",")})`
    : `school_id.eq.${schoolId}`;
}

/** Throws if lessons from other schools are still booked on this boat. */
export async function assertBoatNotUsedByOtherSchools(
  supabase: SupabaseClient,
  boatId: number
) {
  const { data } = await supabase.rpc("boat_other_school_lessons", { p_boat_id: boatId });

  if (typeof data === "number" && data > 0) {
    throw new Error(
      "Other schools still have lessons booked on this boat. Remove their access under “Share boat” and ask them to move or delete those lessons first."
    );
  }
}
