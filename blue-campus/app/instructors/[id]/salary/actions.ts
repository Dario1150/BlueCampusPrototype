"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function paySalary(formData: FormData) {
    const supabase = await createClient();
    const instructorId = Number(formData.get("instructor_id"));

    const { data: pending, error } = await supabase
        .from("transactions")
        .select("id, amount")
        .eq("instructor_id", instructorId)
        .eq("category", "Salary")
        .eq("status", "Pending");

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    if (!pending || pending.length === 0) {
        throw new Error("There is no pending salary to pay.");
    }

    const total = pending.reduce((sum, t) => sum + Number(t.amount), 0);

    const { error: insertError } = await supabase.from("transactions").insert({
        school_id: 2,
        instructor_id: instructorId,
        date: new Date().toISOString().slice(0, 10),
        amount: Math.round(total * 100) / 100,
        type: "Bank Transfer",
        category: "Salary",
        status: "Paid",
        description: `Payout for ${pending.length} lesson${pending.length > 1 ? "s" : ""}`,
    });

    if (insertError) {
        console.error(insertError);
        throw new Error(insertError.message);
    }

    const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .in("id", pending.map((t) => t.id));

    if (deleteError) {
        console.error(deleteError);
        throw new Error(deleteError.message);
    }

    revalidatePath(`/instructors/${instructorId}/salary`);
    revalidatePath("/transactions");
    revalidatePath("/performance");
    revalidatePath("/");
}
