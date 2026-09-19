import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import InputForm from "../components/InputForm";

export default async function NewCoursePage() {
    const profile = await getCurrentProfile();

    if (profile?.role !== "admin") {
        return <InputForm />
    }

    const supabase = await createClient();
    const { data: schools } = await supabase.from("schools").select("id, name");

    return <InputForm schools={schools ?? []} defaultSchoolId={profile.activeSchoolId ?? undefined} />
}