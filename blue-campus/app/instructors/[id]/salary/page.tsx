import { createClient } from "@/lib/supabase/server";
import SalaryBoard from "./SalaryBoard";

type PendingRow = {
    id: number
    amount: number
    date: string
    lesson: { id: number; date: string; course: { name: string } | null } | null
}

type PaidRow = {
    id: number
    amount: number
    date: string
    description: string | null
}

export default async function InstructorSalaryPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();

    const [{ data: instructor }, { data: pending }, { data: paid }] = await Promise.all([
        supabase.from("instructors").select("id, first_name, last_name").eq("id", id).single(),
        supabase
            .from("transactions")
            .select("id, amount, date, lesson:lessons(id, date, course:courses(name))")
            .eq("instructor_id", id)
            .eq("category", "Salary")
            .eq("status", "Pending")
            .order("date", { ascending: true })
            .returns<PendingRow[]>(),
        supabase
            .from("transactions")
            .select("id, amount, date, description")
            .eq("instructor_id", id)
            .eq("category", "Salary")
            .eq("status", "Paid")
            .order("date", { ascending: false })
            .limit(10)
            .returns<PaidRow[]>(),
    ])

    return (
        <SalaryBoard
            instructor={instructor ?? { id: Number(id), first_name: "Unknown", last_name: "instructor" }}
            pending={pending ?? []}
            paid={paid ?? []}
        />
    )
}
