"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { cascadeDeleteSchool } from "@/lib/cascade";
import { getCurrentProfile, requireRole, ACTIVE_SCHOOL_COOKIE } from "@/lib/auth/current-profile";

/** Sets (or, with an empty school_id, clears) the admin's "view as school" selection. */
export async function setActiveSchool(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin"]);
  const schoolId = formData.get("school_id") as string | null;
  const cookieStore = await cookies();

  if (schoolId) {
    cookieStore.set(ACTIVE_SCHOOL_COOKIE, schoolId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  } else {
    cookieStore.delete(ACTIVE_SCHOOL_COOKIE);
  }

  revalidatePath("/", "layout");
}

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