import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import InputForm from "@/app/instructors/components/InputForm";

export default async function EditInstructorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();
    const profile = await getCurrentProfile();

    const { data: instructor } = await supabase
        .from("instructors")
        .select("*")
        .eq("id", id)
        .single()

    if (profile?.role !== "admin") {
        return <InputForm instructor={instructor} />
    }

    const { data: schools } = await supabase.from("schools").select("id, name");

    return <InputForm instructor={instructor} schools={schools ?? []} />
}
