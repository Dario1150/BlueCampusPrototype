"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cascadeDeleteSchool } from "@/lib/cascade";
import { getCurrentProfile, requireRole } from "@/lib/auth/current-profile";

export async function addSchool(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin"]);
  const supabase = await createClient();
  const school = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    website: formData.get("website") as string,
    adress: formData.get("adress") as string,
    city: formData.get("city") as string,
  }

  const { error } = await supabase
    .from("schools")
    .insert(school);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

export async function editSchool(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin"]);
  const supabase = await createClient();

  const id = Number(formData.get("id"))

  const school = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    phone: formData.get("phone") as string,
    website: formData.get("website") as string,
    adress: formData.get("adress") as string,
    city: formData.get("city") as string,
    country: formData.get("country") as string,
  }

  const { error } = await supabase
    .from("schools")
    .update(school)
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/schools")
  redirect("/schools")
}

export async function deleteSchool(formData: FormData) {
    requireRole(await getCurrentProfile(), ["admin"]);
    const supabase = await createClient();

    const id = Number(formData.get("id"))

    const { error } = await supabase
        .from("schools")
        .delete()
        .eq("id", id)

    if (error) {
        console.error(error)
        throw new Error(error.message)
    }

    revalidatePath("/schools")
}

export async function cascadeDeleteSchoolAction(formData: FormData) {
    requireRole(await getCurrentProfile(), ["admin"]);
    const id = Number(formData.get("id"))

    await cascadeDeleteSchool(id)

    revalidatePath("/schools")
    revalidatePath("/courses")
    revalidatePath("/students")
    revalidatePath("/instructors")
    revalidatePath("/boats")
    revalidatePath("/lessons")
    revalidatePath("/registrations")
    revalidatePath("/transactions")
}