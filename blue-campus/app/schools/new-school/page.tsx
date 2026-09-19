import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import InputForm from "../components/InputForm";

export default async function NewSchoolPage() {
    const profile = await getCurrentProfile();
    if (profile?.role !== "admin") redirect("/");

    return <InputForm />
}