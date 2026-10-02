"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { randomInt } from "node:crypto";
import { cascadeDeleteBoat } from "@/lib/cascade";
import { assertBoatNotUsedByOtherSchools } from "@/lib/boats";
import { getCurrentProfile, effectiveSchoolId, requireRole } from "@/lib/auth/current-profile";

export async function newBoat(formData: FormData) {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();
  const boat = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    capacity: formData.get("capacity") as string,
    registration_number: formData.get("registration_number") as string,
    notes: formData.get("notes") as string,
    school_id: effectiveSchoolId(profile, formData.get("school_id") as string | null),
  }

  const { error } = await supabase
    .from("boats")
    .insert(boat);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

export async function editBoat(formData: FormData) {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();

  const id = Number(formData.get("id"))

  const boat = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    capacity: formData.get("capacity") as string,
    registration_number: formData.get("registration_number") as string,
    notes: formData.get("notes") as string,
    school_id: effectiveSchoolId(profile, formData.get("school_id") as string | null),
  }

  const { error } = await supabase
    .from("boats")
    .update(boat)
    .eq("id", id)
    .select()

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/boats");
  redirect("/boats")
}

export async function deleteBoat(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();
  const id = Number(formData.get("id"))

  await assertBoatNotUsedByOtherSchools(supabase, id)

  const { error } = await supabase
    .from("boats")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/boats")
}

export async function cascadeDeleteBoatAction(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school"]);
  const id = Number(formData.get("id"))

  await cascadeDeleteBoat(id)

  revalidatePath("/boats")
  revalidatePath("/lessons")
  revalidatePath("/transactions")
}

// Unambiguous characters only (no 0/O, 1/I/L) so codes are easy to read out or type.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

function generateShareCode() {
  const chars = Array.from({ length: 10 }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)])
  return `${chars.slice(0, 5).join("")}-${chars.slice(5).join("")}`
}

/** Creates (or replaces) a boat's share code, or turns sharing-by-code off. Returns the new code, or null when disabled. */
export async function setBoatShareCode(formData: FormData): Promise<string | null> {
  requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();
  const boatId = Number(formData.get("boat_id"))
  const mode = formData.get("mode") as "generate" | "disable"

  if (mode === "disable") {
    const { error } = await supabase.from("boat_share_codes").delete().eq("boat_id", boatId)

    if (error) {
      console.error(error)
      throw new Error(error.message)
    }

    revalidatePath("/boats")
    return null
  }

  // RLS only lets the owning school (or admin) write here, so a borrowed
  // boat can't be given a code by the school it was shared with.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateShareCode()
    const { error } = await supabase
      .from("boat_share_codes")
      .upsert({ boat_id: boatId, code }, { onConflict: "boat_id" })

    if (!error) {
      revalidatePath("/boats")
      return code
    }

    // 23505 = the random code collided with an existing one; just try another.
    if (error.code !== "23505") {
      console.error(error)
      throw new Error(error.message)
    }
  }

  throw new Error("Could not generate a unique code. Please try again.")
}

/** Adds another school's boat to this school using its share code. Returns the boat's name. */
export async function linkSharedBoat(formData: FormData): Promise<string | null> {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school"]);
  const code = ((formData.get("code") as string) ?? "").trim()

  if (!code) {
    throw new Error("Please enter a boat code.")
  }

  if (profile.role === "admin" && !profile.activeSchoolId) {
    throw new Error("Pick a school first (Schools → Display data for this school), then add the boat to it.")
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("link_boat_by_code", {
    p_code: code,
    p_school_id: profile.role === "admin" ? profile.activeSchoolId : null,
  })

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/boats")
  revalidatePath("/lessons")

  return (data as { out_boat_name: string }[] | null)?.[0]?.out_boat_name ?? null
}

/** Removes one school's access to a boat — used by the owner to revoke, or by the borrowing school to stop using it. */
export async function removeBoatShare(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();
  const boatId = Number(formData.get("boat_id"))
  const schoolId = Number(formData.get("school_id"))

  const { error } = await supabase
    .from("boat_shares")
    .delete()
    .eq("boat_id", boatId)
    .eq("school_id", schoolId)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/boats")
  revalidatePath("/lessons")
}
