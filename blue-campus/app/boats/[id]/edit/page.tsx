import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import InputForm from "@/app/boats/components/InputForm";

export default async function EditBoatsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();
    const profile = await getCurrentProfile();

    const { data: boat } = await supabase
        .from("boats")
        .select("*")
        .eq("id", id)
        .single()

    if (profile?.role !== "admin") {
        // A boat shared by another school is visible here, but only its owner may edit it.
        if (boat && boat.school_id !== profile?.school_id) redirect("/boats")
        return <InputForm boat={boat} />
    }

    const { data: schools } = await supabase.from("schools").select("id, name");

    return <InputForm boat={boat} schools={schools ?? []} />
}
