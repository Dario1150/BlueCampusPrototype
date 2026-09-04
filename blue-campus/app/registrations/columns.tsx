"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { deleteRegistration, cascadeDeleteRegistrationAction } from "./actions"
import { formatDate } from "@/lib/utils"
import DeleteGuardDialog, { Relation } from "@/components/delete-guard-dialog"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Registration = {
  id: string
  registration_date: string
  status: string
  student: {
    id: string
    first_name: string
    last_name: string
  } | null
  course: {
    id: string
    name: string
  } | null
  _relations?: Relation[]
}

export const columns: ColumnDef<Registration>[] = [
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
    id: "student_name",
    accessorFn: (row) =>
      row.student ? `${row.student.first_name} ${row.student.last_name}` : "Unknown student",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Student
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    id: "course_name",
    accessorFn: (row) => row.course?.name ?? "Unknown course",
    header: "Course",
  },
  {
    accessorKey: "registration_date",
    header: "Registration Date",
    cell: ({ row }) => formatDate(row.original.registration_date),
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const registration = row.original

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
            <DropdownMenuItem asChild>
              <Link href={`/registrations/${registration.id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/registrations/${registration.id}/skills`}>
                View skills
              </Link>
            </DropdownMenuItem>
            <DeleteGuardDialog
              itemLabel={`this registration${registration.student ? ` for ${registration.student.first_name} ${registration.student.last_name}` : ""}`}
              id={registration.id}
              relations={registration._relations ?? []}
              deleteAction={deleteRegistration}
              cascadeAction={cascadeDeleteRegistrationAction}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
]
