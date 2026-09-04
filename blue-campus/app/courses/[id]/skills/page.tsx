import { createClient } from "@/lib/supabase/server";
import SkillsBoard from "./SkillsBoard";

export default async function CourseSkillsPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient();

    const [{ data: course }, { data: skillSet }] = await Promise.all([
        supabase.from("courses").select("id, name").eq("id", id).single(),
        supabase.from("skill_sets").select("id").eq("course_id", id).limit(1).maybeSingle(),
    ])

    const { data: skills } = skillSet
        ? await supabase
              .from("skills")
              .select("id, skill_name, description")
              .eq("skill_set", skillSet.id)
              .order("id")
        : { data: [] }

    return (
        <SkillsBoard
            course={course ?? { id: Number(id), name: "Unknown course" }}
            skillSetId={skillSet?.id ?? null}
            skills={skills ?? []}
        />
    )
}
