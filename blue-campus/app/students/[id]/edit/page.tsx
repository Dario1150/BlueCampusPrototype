import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import InputForm from "@/app/students/components/InputForm";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();
    const profile = await getCurrentProfile();

    const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single()

    if (profile?.role !== "admin") {
        return <InputForm student={student} />
    }

    const { data: schools } = await supabase.from("schools").select("id, name");

    return <InputForm student={student} schools={schools ?? []} />
}
