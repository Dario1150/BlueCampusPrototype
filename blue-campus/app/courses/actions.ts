"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cascadeDeleteCourse } from "@/lib/cascade";

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const course = {
    school_id: formData.get("school_id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    status: formData.get("status") as string,
  }

  const { error } = await supabase
    .from("courses")
    .insert(course);

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

export async function updateCourse(formData: FormData) {
  const supabase = await createClient();

  const id = Number(formData.get("id"))

  const course = {
    school_id: formData.get("school_id") as string,
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    category: formData.get("category") as string,
    status: formData.get("status") as string,
  }

  const { error } = await supabase
    .from("courses")
    .update(course)
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/courses");
  redirect("/courses")
}

export async function deleteCourse(formData: FormData) {
  const supabase = await createClient();
  const id = Number(formData.get("id"))

  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/courses")
}

export async function cascadeDeleteCourseAction(formData: FormData) {
  const id = Number(formData.get("id"))

  await cascadeDeleteCourse(id)

  revalidatePath("/courses")
  revalidatePath("/lessons")
  revalidatePath("/registrations")
  revalidatePath("/transactions")
}