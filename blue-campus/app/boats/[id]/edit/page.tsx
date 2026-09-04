import { createClient } from "@/lib/supabase/server";
import InputForm from "@/app/boats/components/InputForm";

export default async function EditBoatsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();

    const { data: boat } = await supabase
        .from("boats")
        .select("*")
        .eq("id", id)
        .single()

    return <InputForm boat={boat} />
}
