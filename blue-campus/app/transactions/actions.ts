"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfile, effectiveSchoolId, requireRole, type CurrentProfile } from "@/lib/auth/current-profile";
import type { SupabaseClient } from "@supabase/supabase-js";

function readTransaction(formData: FormData) {
  const studentId = formData.get("student_id") as string;
  const instructorId = formData.get("instructor_id") as string;
  const lessonId = formData.get("lesson_id") as string;
  const registrationId = formData.get("registration_id") as string;
  const boatId = formData.get("boat_id") as string;

  return {
    student_id: studentId ? Number(studentId) : null,
    instructor_id: instructorId ? Number(instructorId) : null,
    lesson_id: lessonId ? Number(lessonId) : null,
    registration_id: registrationId ? Number(registrationId) : null,
    boat_id: boatId ? Number(boatId) : null,
    date: formData.get("date") as string,
    amount: Number(formData.get("amount")),
    type: formData.get("type") as string,
    category: formData.get("category") as string,
    status: formData.get("status") as string,
    description: (formData.get("description") as string) || null,
  }
}

/** Resolves which school a transaction belongs to via whichever related record is present. */
async function resolveTransactionSchoolId(
  supabase: SupabaseClient,
  profile: CurrentProfile,
  tx: ReturnType<typeof readTransaction>
): Promise<number> {
  if (profile.role !== "admin") {
    return effectiveSchoolId(profile, null);
  }

  if (tx.lesson_id) {
    const { data } = await supabase.from("lessons").select("school_id").eq("id", tx.lesson_id).single();
    if (data?.school_id) return effectiveSchoolId(profile, data.school_id);
  }
  if (tx.registration_id) {
    const { data } = await supabase.from("registrations").select("school_id").eq("id", tx.registration_id).single();
    if (data?.school_id) return effectiveSchoolId(profile, data.school_id);
  }
  if (tx.student_id) {
    const { data } = await supabase.from("students").select("school_id").eq("id", tx.student_id).single();
    if (data?.school_id) return effectiveSchoolId(profile, data.school_id);
  }
  if (tx.instructor_id) {
    const { data } = await supabase.from("instructors").select("school_id").eq("id", tx.instructor_id).single();
    if (data?.school_id) return effectiveSchoolId(profile, data.school_id);
  }
  if (tx.boat_id) {
    const { data } = await supabase.from("boats").select("school_id").eq("id", tx.boat_id).single();
    if (data?.school_id) return effectiveSchoolId(profile, data.school_id);
  }

  throw new Error("Could not determine which school this transaction belongs to.");
}

export async function createTransaction(formData: FormData) {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const supabase = await createClient();
  const tx = readTransaction(formData);
  const school_id = await resolveTransactionSchoolId(supabase, profile, tx);

  const { error } = await supabase
    .from("transactions")
    .insert({ ...tx, school_id });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/lessons");
  redirect("/transactions");
}

export async function updateTransaction(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const supabase = await createClient();
  const id = Number(formData.get("id"))

  const { error } = await supabase
    .from("transactions")
    .update({ ...readTransaction(formData), updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/transactions");
  revalidatePath("/lessons");
  redirect("/transactions")
}

export async function deleteTransaction(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const supabase = await createClient();
  const id = Number(formData.get("id"))

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/transactions")
  revalidatePath("/lessons");
}

export async function addLessonPayment(formData: FormData) {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const supabase = await createClient();
  const tx = readTransaction(formData);
  const school_id = await resolveTransactionSchoolId(supabase, profile, tx);

  const { error } = await supabase
    .from("transactions")
    .insert({ ...tx, school_id });

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  revalidatePath("/lessons");
}
