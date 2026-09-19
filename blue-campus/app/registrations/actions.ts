"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cascadeDeleteRegistration } from "@/lib/cascade";
import { getCurrentProfile, effectiveSchoolId, requireRole } from "@/lib/auth/current-profile";

export async function createRegistration(formData: FormData) {
  const profile = requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();

  const courseId = Number(formData.get("course_id"));
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("school_id")
    .eq("id", courseId)
    .single();

  if (courseError) {
    console.error(courseError);
    throw new Error(courseError.message);
  }

  const registration = {
    school_id: effectiveSchoolId(profile, course?.school_id ?? null),
    student_id: Number(formData.get("student_id")),
    course_id: courseId,
    registration_date: formData.get("registration_date") as string,
    status: formData.get("status") as string,
  }

  const { data: newRegistration, error } = await supabase
    .from("registrations")
    .insert(registration)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error(error.message);
  }

  const skillSetId = formData.get("skill_set_id") as string;

  if (skillSetId) {
    const { data: skills, error: skillsError } = await supabase
      .from("skills")
      .select("id")
      .eq("skill_set", Number(skillSetId));

    if (skillsError) {
      console.error(skillsError);
      throw new Error(skillsError.message);
    }

    if (skills.length > 0) {
      const { error: trackingError } = await supabase.from("skill_tracking").insert(
        skills.map((skill) => ({
          student_registration: newRegistration.id,
          skill: skill.id,
          status: "Beginner",
        }))
      );

      if (trackingError) {
        console.error(trackingError);
        throw new Error(trackingError.message);
      }
    }
  }

  revalidatePath("/registrations");
  redirect("/registrations");
}

export async function updateRegistration(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();
  const id = Number(formData.get("id"))

  const registration = {
    student_id: Number(formData.get("student_id")),
    course_id: Number(formData.get("course_id")),
    registration_date: formData.get("registration_date") as string,
    status: formData.get("status") as string,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from("registrations")
    .update(registration)
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/registrations");
  redirect("/registrations")
}

export async function updateSkillTracking(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const supabase = await createClient();
  const id = Number(formData.get("id"))

  const { error } = await supabase
    .from("skill_tracking")
    .update({
      status: formData.get("status") as string,
      description: (formData.get("description") as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/registrations");
}

export async function updateSkillTrackingBulk(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school", "instructor"]);
  const supabase = await createClient();
  const idsRaw = formData.get("skill_tracking_ids") as string;
  const ids = idsRaw.split(",").filter(Boolean).map(Number);

  const results = await Promise.all(
    ids.map((id) =>
      supabase
        .from("skill_tracking")
        .update({
          status: formData.get(`status-${id}`) as string,
          description: (formData.get(`description-${id}`) as string) || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
    )
  );

  const failed = results.find((result) => result.error);

  if (failed?.error) {
    console.error(failed.error);
    throw new Error(failed.error.message);
  }

  revalidatePath("/lessons");
  revalidatePath("/registrations");
}

export async function deleteRegistration(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school"]);
  const supabase = await createClient();
  const id = Number(formData.get("id"))

  const { error: trackingError } = await supabase
    .from("skill_tracking")
    .delete()
    .eq("student_registration", id)

  if (trackingError) {
    console.error(trackingError)
    throw new Error(trackingError.message)
  }

  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(error)
    throw new Error(error.message)
  }

  revalidatePath("/registrations")
}

export async function cascadeDeleteRegistrationAction(formData: FormData) {
  requireRole(await getCurrentProfile(), ["admin", "school"]);
  const id = Number(formData.get("id"))

  await cascadeDeleteRegistration(id)

  revalidatePath("/registrations")
  revalidatePath("/transactions")
}
