"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cascadeDeleteBoat } from "@/lib/cascade";

export async function newBoat(formData: FormData) {
  const supabase = await createClient();
  const boat = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    capacity: formData.get("capacity") as string,
    registration_number: formData.get("registration_number") as string,
    notes: formData.get("notes") as string,
    school_id: formData.get("school_id") as string,
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
  const supabase = await createClient();

  const id = Number(formData.get("id"))

  const boat = {
    name: formData.get("name") as string,
    type: formData.get("type") as string,
    capacity: formData.get("capacity") as string,
    registration_number: formData.get("registration_number") as string,
    notes: formData.get("notes") as string,
    school_id: formData.get("school_id") as string,
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
  const supabase = await createClient();
  const id = Number(formData.get("id"))

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
  const id = Number(formData.get("id"))

  await cascadeDeleteBoat(id)

  revalidatePath("/boats")
  revalidatePath("/lessons")
  revalidatePath("/transactions")
}