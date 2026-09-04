import { createClient } from "@/lib/supabase/server";
import InputForm from "@/app/students/components/InputForm";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();

    const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("id", id)
        .single()

    return <InputForm student={student} />
}
