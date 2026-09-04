"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cascadeDeleteSkill } from "@/lib/cascade";

export async function createSkill(formData: FormData) {
    const supabase = await createClient();
    const courseId = Number(formData.get("course_id"));
    const courseName = formData.get("course_name") as string;
    const existingSkillSetId = formData.get("skill_set_id") as string;

    let skillSetId = existingSkillSetId ? Number(existingSkillSetId) : null;

    if (!skillSetId) {
        const { data: newSkillSet, error: skillSetError } = await supabase
            .from("skill_sets")
            .insert({ course_id: courseId, skill_set_title: `${courseName} Skills` })
            .select()
            .single();

        if (skillSetError) {
            console.error(skillSetError);
            throw new Error(skillSetError.message);
        }

        skillSetId = newSkillSet.id;
    }

    const { error } = await supabase.from("skills").insert({
        skill_set: skillSetId,
        skill_name: formData.get("skill_name") as string,
        description: (formData.get("description") as string) || null,
    });

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    revalidatePath(`/courses/${courseId}/skills`);
}

export async function updateSkill(formData: FormData) {
    const supabase = await createClient();
    const id = Number(formData.get("id"));
    const courseId = Number(formData.get("course_id"));

    const { error } = await supabase
        .from("skills")
        .update({
            skill_name: formData.get("skill_name") as string,
            description: (formData.get("description") as string) || null,
        })
        .eq("id", id);

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    revalidatePath(`/courses/${courseId}/skills`);
    revalidatePath("/registrations");
    revalidatePath("/lessons");
}

export async function deleteSkill(formData: FormData) {
    const supabase = await createClient();
    const id = Number(formData.get("id"));

    const { data: skillRow } = await supabase
        .from("skills")
        .select("skill_set")
        .eq("id", id)
        .single();

    await cascadeDeleteSkill(id);

    if (skillRow?.skill_set) {
        const { data: skillSet } = await supabase
            .from("skill_sets")
            .select("course_id")
            .eq("id", skillRow.skill_set)
            .single();

        if (skillSet?.course_id) {
            revalidatePath(`/courses/${skillSet.course_id}/skills`);
        }
    }

    revalidatePath("/registrations");
    revalidatePath("/lessons");
}
