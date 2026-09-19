import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import InputForm from "@/app/transactions/components/InputForm";

type RegistrationRow = {
    id: number
    student: { first_name: string; last_name: string } | null
    course: { name: string } | null
}

async function getOptions(activeSchoolId: number | null) {
    const supabase = await createClient();
    let studentsQuery = supabase.from("students").select("id, first_name, last_name");
    let instructorsQuery = supabase.from("instructors").select("id, first_name, last_name");
    let registrationsQuery = supabase
        .from("registrations")
        .select("id, student:students(first_name, last_name), course:courses(name)");
    let boatsQuery = supabase.from("boats").select("id, name");
    if (activeSchoolId) {
        studentsQuery = studentsQuery.eq("school_id", activeSchoolId);
        instructorsQuery = instructorsQuery.eq("school_id", activeSchoolId);
        registrationsQuery = registrationsQuery.eq("school_id", activeSchoolId);
        boatsQuery = boatsQuery.eq("school_id", activeSchoolId);
    }

    const [{ data: students }, { data: instructors }, { data: registrations }, { data: boats }] = await Promise.all([
        studentsQuery,
        instructorsQuery,
        registrationsQuery.returns<RegistrationRow[]>(),
        boatsQuery,
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
    const profile = await getCurrentProfile();

    const [{ data: transaction }, { students, instructors, registrations, boats }] = await Promise.all([
        supabase
            .from("transactions")
            .select("*")
            .eq("id", id)
            .single(),
        getOptions(profile?.activeSchoolId ?? null),
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
