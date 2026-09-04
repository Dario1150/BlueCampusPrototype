import { createClient } from "@/lib/supabase/server";
import InputForm from "@/app/courses/components/InputForm";

export default async function EditCoursesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();

    const { data: course } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id)
        .single()

    return <InputForm course={course} />
}
