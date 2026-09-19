"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cascadeDeleteInstructor } from "@/lib/cascade";
import { getCurrentProfile, effectiveSchoolId, requireRole } from "@/lib/auth/current-profile";

export async function createInstructor(formData: FormData) {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();
  const instructor = {
    school_id: effectiveSchoolId(profile, formData.get("school_id") as string | null),
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    hourly_rate: formData.get("hourly_rate") as string,
  };

  const { error } = await supabase
    .from("instructors")
    .insert(instructor);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

export async function updateInstructor(formData: FormData) {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();

  const id = Number(formData.get("id"))

  const instructor = {
    school_id: effectiveSchoolId(profile, formData.get("school_id") as string | null),
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    hourly_rate: formData.get("hourly_rate") as string,
  }

  const { error } = await supabase
    .from("instructors")
    .update(instructor)
    .eq("id", id)
    .select()

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/instructors");
  redirect("/instructors")
}

export async function deleteInstructor(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();
  const id = Number(formData.get("id"))

  const { error } = await supabase
    .from("instructors")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/instructors")
}

export async function cascadeDeleteInstructorAction(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school"]);
  const id = Number(formData.get("id"))

  await cascadeDeleteInstructor(id)

  revalidatePath("/instructors")
  revalidatePath("/lessons")
  revalidatePath("/transactions")
}
