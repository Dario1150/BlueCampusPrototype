import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "school" | "instructor" | "student";

export type CurrentProfile = {
  id: string;
  email: string | null;
  role: Role;
  school_id: number | null;
  student_id: number | null;
};

/**
 * Cached per-request: every page.tsx/actions.ts that calls this in the same
 * request tree shares one query instead of hitting `profiles` repeatedly.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, role, school_id, student_id")
    .eq("id", user.id)
    .single();

  if (error || !data) return null;

  return data as CurrentProfile;
});

/**
 * The single place that decides which school_id a write should use: admin
 * may act on whatever school was submitted/derived; every other role always
 * uses their own profile's school_id, ignoring client input entirely (a
 * school-scoped user must never be able to write into another school's data
 * via a tampered form field — RLS is the backstop, this keeps behavior clean).
 */
export function effectiveSchoolId(
  profile: CurrentProfile,
  candidateSchoolId: string | number | null | undefined
): number {
  if (profile.role === "admin") {
    const id = Number(candidateSchoolId);
    if (!candidateSchoolId || Number.isNaN(id)) {
      throw new Error("A school could not be determined for this record.");
    }
    return id;
  }

  if (profile.school_id == null) {
    throw new Error("Your account is not assigned to a school.");
  }

  return profile.school_id;
}

/** Defense-in-depth guard for write actions a role should never reach at all (RLS is the real boundary). */
export function requireRole(profile: CurrentProfile | null, allowed: Role[]): CurrentProfile {
  if (!profile) {
    throw new Error("Not authenticated.");
  }
  if (!allowed.includes(profile.role)) {
    throw new Error("You don't have permission to do that.");
  }
  return profile;
}
