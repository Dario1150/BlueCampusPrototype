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
        return <InputForm boat={boat} />
    }

    const { data: schools } = await supabase.from("schools").select("id, name");

    return <InputForm boat={boat} schools={schools ?? []} />
}
