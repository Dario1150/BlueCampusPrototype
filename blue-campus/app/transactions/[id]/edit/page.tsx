import { createClient } from "@/lib/supabase/server";
import InputForm from "@/app/transactions/components/InputForm";

type RegistrationRow = {
    id: number
    student: { first_name: string; last_name: string } | null
    course: { name: string } | null
}

async function getOptions() {
    const supabase = await createClient();
    const [{ data: students }, { data: instructors }, { data: registrations }, { data: boats }] = await Promise.all([
        supabase.from("students").select("id, first_name, last_name"),
        supabase.from("instructors").select("id, first_name, last_name"),
        supabase
            .from("registrations")
            .select("id, student:students(first_name, last_name), course:courses(name)")
            .returns<RegistrationRow[]>(),
        supabase.from("boats").select("id, name"),
    ])

    return {
        students: students ?? [],
        instructors: instructors ?? [],
        registrations: (registrations ?? []).map((registration) => ({
            id: registration.id,
            label: `${registration.student?.first_name ?? "Unknown"} ${registration.student?.last_name ?? ""} – ${registration.course?.name ?? "Unknown course"}`,
        })),
        boats: boats ?? [],
    }
}

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();

    const [{ data: transaction }, { students, instructors, registrations, boats }] = await Promise.all([
        supabase
            .from("transactions")
            .select("*")
            .eq("id", id)
            .single(),
        getOptions(),
    ])

    return (
        <InputForm
            transaction={transaction}
            students={students}
            instructors={instructors}
            registrations={registrations}
            boats={boats}
        />
    )
}
