import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { countRelated } from "@/lib/cascade";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/page-header";
import { SchoolsTable } from "./columns"

async function getData(){
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schools")
    .select("*");

  if (error) {
    console.error(error);
    return [];
  }

  const schoolIds = data.map((school) => school.id);
  const [courseCounts, studentCounts, instructorCounts, boatCounts] = await Promise.all([
    countRelated("courses", "school_id", schoolIds),
    countRelated("students", "school_id", schoolIds),
    countRelated("instructors", "school_id", schoolIds),
    countRelated("boats", "school_id", schoolIds),
  ]);

  return data.map((school) => {
    const courses = courseCounts.get(school.id) ?? 0;
    const students = studentCounts.get(school.id) ?? 0;
    const instructors = instructorCounts.get(school.id) ?? 0;
    const boats = boatCounts.get(school.id) ?? 0;

    return {
      ...school,
      _relations: [
        ...(courses ? [{ label: `${courses} course${courses > 1 ? "s" : ""}`, href: "/courses" }] : []),
        ...(students ? [{ label: `${students} student${students > 1 ? "s" : ""}`, href: "/students" }] : []),
        ...(instructors
          ? [{ label: `${instructors} instructor${instructors > 1 ? "s" : ""}`, href: "/instructors" }]
          : []),
        ...(boats ? [{ label: `${boats} boat${boats > 1 ? "s" : ""}`, href: "/boats" }] : []),
      ],
    };
  });
}

export default async function SchoolPage() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/");

  const data = await getData()

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={Building2} title="Schools">
        <Button asChild>
          <Link href="/schools/new-school">New school</Link>
        </Button>
      </PageHeader>
      <SchoolsTable activeSchoolId={profile.activeSchoolId} data={data} />
    </div>
  )
}