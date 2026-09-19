"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { deleteCourse, cascadeDeleteCourseAction } from "./actions"
import DeleteGuardDialog, { Relation } from "@/components/delete-guard-dialog"
import type { Role } from "@/lib/auth/current-profile"
import { DataTable } from "./data-table"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Course = {
  id: string
  school_id: string
  name: string
  description: string
  category: string
  status: string
  _relations?: Relation[]
}

export function getColumns(role: Role): ColumnDef<Course>[] {
  const canWrite = role === "admin" || role === "school"

  return [
    {
    id: "select",
    header: ({ table }) => (
    <Checkbox
        checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
    />
    ),
    cell: ({ row }) => (
    <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
    />
    ),
    enableSorting: false,
    enableHiding: false,
    },
    {
    accessorKey: "name",
    header: ({ column }) => {
        return (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
    },
  },
  {
    accessorKey: "description",
    header: "Description"
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "status",
    header: "Status"
  },
  ...(canWrite ? [{
    id: "actions",
    cell: ({ row }: { row: { original: Course } }) => {
      const course = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Info</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/courses/${course.id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/courses/${course.id}/skills`}>
                Skills
              </Link>
            </DropdownMenuItem>
            <DeleteGuardDialog
              itemLabel={course.name}
              id={course.id}
              relations={course._relations ?? []}
              deleteAction={deleteCourse}
              cascadeAction={cascadeDeleteCourseAction}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
  }] : []),
  ]
}

export function CoursesTable({ role, data }: { role: Role; data: Course[] }) {
  return <DataTable columns={getColumns(role)} data={data} />
}