import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import InputForm from "@/app/schools/components/InputForm";

export default async function EditSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const profile = await getCurrentProfile();
    if (profile?.role !== "admin") redirect("/");

    const { id } = await params
    const supabase = await createClient();

    const { data: school } = await supabase
        .from("schools")
        .select("*")
        .eq("id", id)
        .single()

    return <InputForm school={school} />
}
