"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { cascadeDeleteLesson } from "@/lib/cascade";

type ConflictCheck = {
    date: string
    startTime: string
    endTime: string
    boatId?: number | null
    instructorId?: number | null
    studentIds?: number[]
    excludeLessonId?: number
}

type ConflictingLesson = {
    id: number
    start_time: string
    end_time: string
    boat_id: number | null
    instructor_id: number | null
    boat: { name: string } | null
    instructor: { first_name: string; last_name: string } | null
    participants: { student_id: number; student: { first_name: string; last_name: string } | null }[]
}

/**
 * Finds the first scheduling conflict (same boat, instructor, or student booked
 * at an overlapping time on the same day) and returns a human-readable message,
 * or null if there's no conflict.
 */
async function findSchedulingConflict({
    date,
    startTime,
    endTime,
    boatId,
    instructorId,
    studentIds = [],
    excludeLessonId,
}: ConflictCheck): Promise<string | null> {
    if (!boatId && !instructorId && studentIds.length === 0) {
        return null;
    }

    const supabase = await createClient();

    let query = supabase
        .from("lessons")
        .select(
            "id, start_time, end_time, boat_id, instructor_id, boat:boats(name), instructor:instructors(first_name, last_name), participants:lesson_participants(student_id, student:students(first_name, last_name))"
        )
        .eq("date", date);

    if (excludeLessonId) {
        query = query.neq("id", excludeLessonId);
    }

    const { data: lessons, error } = await query.returns<ConflictingLesson[]>();

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    // Normalize to "HH:MM" before comparing: form times arrive without seconds
    // while stored times include them, and "10:30" < "10:30:00" is otherwise
    // (incorrectly) true as a plain string comparison.
    const newStart = startTime.slice(0, 5);
    const newEnd = endTime.slice(0, 5);

    const overlapping = (lessons ?? []).filter((lesson) => {
        const existingStart = lesson.start_time.slice(0, 5);
        const existingEnd = lesson.end_time.slice(0, 5);
        return newStart < existingEnd && existingStart < newEnd;
    });

    for (const lesson of overlapping) {
        const timeRange = `${lesson.start_time.slice(0, 5)}–${lesson.end_time.slice(0, 5)}`;

        if (boatId && lesson.boat_id === boatId) {
            return `${lesson.boat?.name ?? "This boat"} is already booked ${timeRange}.`;
        }

        if (instructorId && lesson.instructor_id === instructorId) {
            const name = lesson.instructor
                ? `${lesson.instructor.first_name} ${lesson.instructor.last_name}`
                : "This instructor";
            return `${name} is already booked ${timeRange}.`;
        }

        for (const participant of lesson.participants) {
            if (studentIds.includes(participant.student_id)) {
                const name = participant.student
                    ? `${participant.student.first_name} ${participant.student.last_name}`
                    : "This student";
                return `${name} is already booked ${timeRange}.`;
            }
        }
    }

    return null;
}

export async function createLessonsForDate(formData: FormData) {
    const supabase = await createClient();
    const date = formData.get("lesson_date") as string;
    const templateGroupId = Number(formData.get("template_group_id"));
    const boatId = formData.get("boat_id") as string;

    // Get the rows belonging to the chosen template group (e.g. "Weekday" or "Weekend")
    const { data: templates, error: templateError } = await supabase
        .from("lesson_template")
        .select("*")
        .eq("template", templateGroupId);

    if (templateError) {
        console.error(templateError);
        throw new Error("Could not load lesson template");
    }

    if (boatId) {
        for (const template of templates) {
            const conflict = await findSchedulingConflict({
                date,
                startTime: template.start_time,
                endTime: template.end_time,
                boatId: Number(boatId),
            });

            if (conflict) {
                throw new Error(conflict);
            }
        }
    }

    // Create the actual (still unassigned) lessons for that day
    const lessons = templates.map((template) => ({
        school_id: 2,
        date: date,
        course_id: template.course_id,
        start_time: template.start_time,
        end_time: template.end_time,
        boat_id: boatId ? Number(boatId) : null,
        status: "Open",
    }));

    // Insert all lessons at once
    const { error } = await supabase
        .from("lessons")
        .insert(lessons)
        .select();

    if (error) {
        console.error(error);
        throw new Error("Could not create lessons");
    }

    revalidatePath("/lessons");
}

export async function createSingleLesson(formData: FormData) {
    const supabase = await createClient();
    const boatId = formData.get("boat_id") as string;
    const instructorId = formData.get("instructor_id") as string;
    const date = formData.get("date") as string;
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;
    const studentIds = formData.getAll("student_ids").map(Number);

    const conflict = await findSchedulingConflict({
        date,
        startTime,
        endTime,
        boatId: boatId ? Number(boatId) : null,
        instructorId: instructorId ? Number(instructorId) : null,
        studentIds,
    });

    if (conflict) {
        throw new Error(conflict);
    }

    const lesson = {
        school_id: 2,
        course_id: Number(formData.get("course_id")),
        date,
        start_time: startTime,
        end_time: endTime,
        boat_id: boatId ? Number(boatId) : null,
        instructor_id: instructorId ? Number(instructorId) : null,
        status: instructorId ? "Scheduled" : "Open",
    };

    const { data: newLesson, error } = await supabase
        .from("lessons")
        .insert(lesson)
        .select()
        .single();

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    if (studentIds.length > 0) {
        const { error: participantsError } = await supabase.from("lesson_participants").insert(
            studentIds.map((studentId) => ({
                lesson_id: newLesson.id,
                student_id: studentId,
            }))
        );

        if (participantsError) {
            console.error(participantsError);
            throw new Error(participantsError.message);
        }
    }

    revalidatePath("/lessons");
}

export async function duplicateLesson(formData: FormData) {
    const supabase = await createClient();
    const sourceLessonId = Number(formData.get("source_lesson_id"));
    const date = formData.get("date") as string;
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;

    const [{ data: sourceLesson, error: sourceError }, { data: participants, error: participantsError }] =
        await Promise.all([
            supabase
                .from("lessons")
                .select("course_id, boat_id, instructor_id")
                .eq("id", sourceLessonId)
                .single(),
            supabase
                .from("lesson_participants")
                .select("student_id")
                .eq("lesson_id", sourceLessonId),
        ]);

    if (sourceError) {
        console.error(sourceError);
        throw new Error(sourceError.message);
    }

    if (participantsError) {
        console.error(participantsError);
        throw new Error(participantsError.message);
    }

    const conflict = await findSchedulingConflict({
        date,
        startTime,
        endTime,
        boatId: sourceLesson.boat_id,
        instructorId: sourceLesson.instructor_id,
        studentIds: participants.map((p) => p.student_id),
    });

    if (conflict) {
        throw new Error(conflict);
    }

    const { data: newLesson, error } = await supabase
        .from("lessons")
        .insert({
            school_id: 2,
            course_id: sourceLesson.course_id,
            boat_id: sourceLesson.boat_id,
            instructor_id: sourceLesson.instructor_id,
            date,
            start_time: startTime,
            end_time: endTime,
            status: sourceLesson.instructor_id ? "Scheduled" : "Open",
        })
        .select()
        .single();

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    if (participants.length > 0) {
        const { error: insertParticipantsError } = await supabase.from("lesson_participants").insert(
            participants.map((participant) => ({
                lesson_id: newLesson.id,
                student_id: participant.student_id,
            }))
        );

        if (insertParticipantsError) {
            console.error(insertParticipantsError);
            throw new Error(insertParticipantsError.message);
        }
    }

    revalidatePath("/lessons");
}

export async function updateLesson(formData: FormData) {
    const supabase = await createClient();
    const id = Number(formData.get("id"));

    const instructorId = formData.get("instructor_id") as string;
    const boatId = formData.get("boat_id") as string;
    const courseId = formData.get("course_id") as string;
    const date = formData.get("date") as string;
    const startTime = formData.get("start_time") as string;
    const endTime = formData.get("end_time") as string;

    const { data: currentParticipants, error: participantsError } = await supabase
        .from("lesson_participants")
        .select("student_id")
        .eq("lesson_id", id);

    if (participantsError) {
        console.error(participantsError);
        throw new Error(participantsError.message);
    }

    const conflict = await findSchedulingConflict({
        date,
        startTime,
        endTime,
        boatId: boatId ? Number(boatId) : null,
        instructorId: instructorId ? Number(instructorId) : null,
        studentIds: (currentParticipants ?? []).map((p) => p.student_id),
        excludeLessonId: id,
    });

    if (conflict) {
        throw new Error(conflict);
    }

    const lesson = {
        course_id: courseId ? Number(courseId) : null,
        instructor_id: instructorId ? Number(instructorId) : null,
        boat_id: boatId ? Number(boatId) : null,
        date,
        start_time: startTime,
        end_time: endTime,
        status: formData.get("status") as string,
        notes: (formData.get("notes") as string) || null,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("lessons")
        .update(lesson)
        .eq("id", id);

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    revalidatePath("/lessons");
}

// Reads only the "HH:MM" portion, ignoring seconds/timezone suffix (e.g. "13:00:00+00").
function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

export async function finishLesson(formData: FormData) {
    const supabase = await createClient();
    const id = Number(formData.get("id"));

    const { data: lesson, error: lessonError } = await supabase
        .from("lessons")
        .select("date, start_time, end_time, instructor_id")
        .eq("id", id)
        .single();

    if (lessonError) {
        console.error(lessonError);
        throw new Error(lessonError.message);
    }

    const { error } = await supabase
        .from("lessons")
        .update({ status: "Completed", updated_at: new Date().toISOString() })
        .eq("id", id);

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    if (lesson.instructor_id) {
        const { data: instructor, error: instructorError } = await supabase
            .from("instructors")
            .select("hourly_rate")
            .eq("id", lesson.instructor_id)
            .single();

        if (instructorError) {
            console.error(instructorError);
            throw new Error(instructorError.message);
        }

        const hourlyRate = Number(instructor?.hourly_rate ?? 0);

        if (hourlyRate > 0) {
            const durationHours = (timeToMinutes(lesson.end_time) - timeToMinutes(lesson.start_time)) / 60;
            const amount = Math.round(hourlyRate * durationHours * 100) / 100;

            if (amount > 0) {
                const { error: salaryError } = await supabase.from("transactions").insert({
                    school_id: 2,
                    instructor_id: lesson.instructor_id,
                    lesson_id: id,
                    date: lesson.date,
                    amount,
                    type: "Bank Transfer",
                    category: "Salary",
                    status: "Pending",
                });

                if (salaryError) {
                    console.error(salaryError);
                    throw new Error(salaryError.message);
                }
            }
        }
    }

    revalidatePath("/lessons");
    revalidatePath("/transactions");
    revalidatePath("/instructors");
    revalidatePath("/performance");
    revalidatePath("/");
}

export async function deleteLesson(formData: FormData) {
    const id = Number(formData.get("id"));

    await cascadeDeleteLesson(id);

    revalidatePath("/lessons");
    revalidatePath("/transactions");
}

export async function addParticipant(formData: FormData) {
    const supabase = await createClient();
    const lessonId = Number(formData.get("lesson_id"));
    const studentIdRaw = formData.get("student_id") as string;

    if (!studentIdRaw) {
        throw new Error("Please select a student first.");
    }

    const studentId = Number(studentIdRaw);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        throw new Error("Please select a valid student.");
    }

    const { data: lesson, error: lessonError } = await supabase
        .from("lessons")
        .select("date, start_time, end_time")
        .eq("id", lessonId)
        .single();

    if (lessonError) {
        console.error(lessonError);
        throw new Error(lessonError.message);
    }

    const conflict = await findSchedulingConflict({
        date: lesson.date,
        startTime: lesson.start_time,
        endTime: lesson.end_time,
        studentIds: [studentId],
        excludeLessonId: lessonId,
    });

    if (conflict) {
        throw new Error(conflict);
    }

    const { error } = await supabase
        .from("lesson_participants")
        .insert({ lesson_id: lessonId, student_id: studentId });

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    revalidatePath("/lessons");
}

export async function removeParticipant(formData: FormData) {
    const supabase = await createClient();
    const id = Number(formData.get("id"));

    const { error } = await supabase
        .from("lesson_participants")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        throw new Error(error.message);
    }

    revalidatePath("/lessons");
}
