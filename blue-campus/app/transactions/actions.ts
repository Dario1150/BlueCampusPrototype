"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function readTransaction(formData: FormData) {
  const studentId = formData.get("student_id") as string;
  const instructorId = formData.get("instructor_id") as string;
  const lessonId = formData.get("lesson_id") as string;
  const registrationId = formData.get("registration_id") as string;
  const boatId = formData.get("boat_id") as string;

  return {
    school_id: 2,
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

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .insert(readTransaction(formData));

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  revalidatePath("/transactions");
  revalidatePath("/lessons");
  redirect("/transactions");
}

export async function updateTransaction(formData: FormData) {
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
  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .insert(readTransaction(formData));

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  revalidatePath("/lessons");
}
