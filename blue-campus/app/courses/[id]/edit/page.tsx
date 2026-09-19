import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import InputForm from "@/app/courses/components/InputForm";

export default async function EditCoursesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();
    const profile = await getCurrentProfile();

    const { data: course } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single()

    if (profile?.role !== "admin") {
        return <InputForm course={course} />
    }

    const { data: schools } = await supabase.from("schools").select("id, name");

    return <InputForm course={course} schools={schools ?? []} />
}
