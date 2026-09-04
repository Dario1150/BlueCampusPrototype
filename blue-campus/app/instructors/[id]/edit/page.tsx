import { createClient } from "@/lib/supabase/server";
import InputForm from "@/app/instructors/components/InputForm";

export default async function EditInstructorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();

    const { data: instructor } = await supabase
        .from("instructors")
        .select("*")
        .eq("id", id)
        .single()

    return <InputForm instructor={instructor} />
}
