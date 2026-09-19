"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cascadeDeleteStudent } from "@/lib/cascade";
import { getCurrentProfile, effectiveSchoolId, requireRole } from "@/lib/auth/current-profile";

export async function createStudent(formData: FormData) {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const supabase = await createClient();
  const student = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    date_of_birth: formData.get("date_of_birth") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    postal_code: formData.get("postal_code") as string,
    city: formData.get("city") as string,
    adress: formData.get("adress") as string,
    school_id: effectiveSchoolId(profile, formData.get("school_id") as string | null),
  };

  const { error } = await supabase
    .from("students")
    .insert(student);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

export async function updateStudent(formData: FormData) {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const supabase = await createClient();

  const id = Number(formData.get("id"))

  const student = {
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    date_of_birth: formData.get("date_of_birth") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string,
    postal_code: formData.get("postal_code") as string,
    city: formData.get("city") as string,
    adress: formData.get("adress") as string,
    school_id: effectiveSchoolId(profile, formData.get("school_id") as string | null),
  }

  const { error } = await supabase
    .from("students")
    .update(student)
    .eq("id", id)
    .select()

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/students");
  redirect("/students")
}

export async function deleteStudent(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const supabase = await createClient();
  const id = Number(formData.get("id"))

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/students")
}

export async function cascadeDeleteStudentAction(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const id = Number(formData.get("id"))

  await cascadeDeleteStudent(id)

  revalidatePath("/students")
  revalidatePath("/registrations")
  revalidatePath("/lessons")
  revalidatePath("/transactions")
}
