import Link from "next/link";
import {
  GraduationCap,
  Anchor,
  Users,
  CalendarClock,
  Compass,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UpcomingLesson = {
  id: number;
  date: string;
  start_time: string;
  status: string | null;
  course: { name: string } | null;
  instructor: { first_name: string; last_name: string } | null;
  boat: { name: string } | null;
};

async function getDashboardData() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const monthPrefix = today.slice(0, 7);

  const [
    { data: registrations },
    { data: boats },
    { data: instructors },
    { data: openLessons },
    { data: transactions },
    { data: upcomingLessons },
  ] = await Promise.all([
    supabase.from("registrations").select("student_id").eq("status", "Active"),
    supabase.from("boats").select("id"),
    supabase.from("instructors").select("id"),
    supabase.from("lessons").select("id").eq("status", "Open"),
    supabase.from("transactions").select("amount, category, date"),
    supabase
      .from("lessons")
      .select(
        "id, date, start_time, status, course:courses(name), instructor:instructors(first_name, last_name), boat:boats(name)"
      )
      .gte("date", today)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(5)
      .returns<UpcomingLesson[]>(),
  ]);

  const activeStudents = new Set((registrations ?? []).map((r) => r.student_id)).size;

  const monthlyTransactions = (transactions ?? []).filter((t) => t.date?.startsWith(monthPrefix));
  const income = monthlyTransactions
    .filter((t) => t.category === "Lesson Fee" || t.category === "Registration Fee")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = monthlyTransactions
    .filter((t) => t.category === "Gas" || t.category === "Repair" || t.category === "Salary")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    activeStudents,
    boatsCount: boats?.length ?? 0,
    instructorsCount: instructors?.length ?? 0,
    openLessonsCount: openLessons?.length ?? 0,
    income,
    expenses,
    upcomingLessons: upcomingLessons ?? [],
  };
}

const STATUS_STYLES: Record<string, string> = {
  Open: "bg-amber-100 text-amber-800",
  Scheduled: "bg-sky-100 text-sky-800",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-gray-200 text-gray-600",
};

export default async function Home() {
  const {
    activeStudents,
    boatsCount,
    instructorsCount,
    openLessonsCount,
    income,
    expenses,
    upcomingLessons,
  } = await getDashboardData();

  const stats = [
    { label: "Active Students", value: activeStudents, href: "/students", icon: GraduationCap },
    { label: "Boats", value: boatsCount, href: "/boats", icon: Anchor },
    { label: "Instructors", value: instructorsCount, href: "/instructors", icon: Users },
    { label: "Open Lessons", value: openLessonsCount, href: "/lessons", icon: CalendarClock },
  ];

  return (
    <div className="container mx-auto py-10">
      <PageHeader icon={Compass} title="The Bridge" subtitle="47.5596° N, 7.5886° E · Basel, Switzerland">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon">
              <Plus />
              <span className="sr-only">Create new</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/lessons/new-lesson">New lesson</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/students/new-student">New student</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/registrations/new-registration">New registration</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
          >
            <div className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </div>
            <div className="pt-3 text-3xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading pb-4 text-lg font-semibold">Finances (this month)</h2>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">Income</span>
            <span className="font-medium text-emerald-700">+{income.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted-foreground">Expenses</span>
            <span className="font-medium text-destructive">-{expenses.toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex items-center justify-between py-1">
            <span className="text-sm font-medium">Net</span>
            <span className="font-semibold">{(income - expenses).toFixed(2)}</span>
          </div>
          <Link href="/transactions" className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline">
            View all transactions
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-heading pb-4 text-lg font-semibold">Upcoming Lessons</h2>

          {upcomingLessons.length === 0 && (
            <p className="text-sm text-muted-foreground">No upcoming lessons scheduled.</p>
          )}

          <div className="flex flex-col gap-3">
            {upcomingLessons.map((lesson) => (
              <div key={lesson.id} className="flex items-center justify-between gap-2 border-b pb-2 last:border-b-0">
                <div>
                  <div className="font-medium">{lesson.course?.name ?? "No course"}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(lesson.date)} · {lesson.start_time?.slice(0, 5)}
                    {lesson.instructor
                      ? ` · ${lesson.instructor.first_name} ${lesson.instructor.last_name}`
                      : " · Unassigned"}
                    {lesson.boat ? ` · ${lesson.boat.name}` : ""}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[lesson.status ?? ""] ?? "bg-gray-200 text-gray-600"}`}
                >
                  {lesson.status ?? "Unscheduled"}
                </span>
              </div>
            ))}
          </div>

          <Link href="/lessons" className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline">
            View all lessons
          </Link>
        </div>
      </div>
    </div>
  );
}
