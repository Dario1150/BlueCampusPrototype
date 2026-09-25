"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { deleteStudent, cascadeDeleteStudentAction } from "./actions"
import DeleteGuardDialog, { Relation } from "@/components/delete-guard-dialog"
import AccountDialog from "./components/AccountDialog"
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
export type Student = {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string
  account?: { email: string } | null
  _relations?: Relation[]
}

export function getColumns(role: Role): ColumnDef<Student>[] {
  const canWrite = role === "admin" || role === "school" || role === "instructor"
  const canManageAccounts = role === "admin" || role === "school"

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
    accessorKey: "first_name",
    header: ({ column }) => {
        return (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
            First Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
    },
  },
  {
    accessorKey: "last_name",
    header: ({ column }) => {
        return (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
            First Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        )
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "email",
    header: "EMail"
  },
  ...(canWrite ? [{
    id: "actions",
    cell: ({ row }: { row: { original: Student } }) => {
      const student = row.original

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
              <Link href={`/students/${student.id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            {canManageAccounts && (
              <AccountDialog
                studentId={Number(student.id)}
                studentName={`${student.first_name} ${student.last_name}`}
                defaultEmail={student.email ?? ""}
                account={student.account ?? null}
              />
            )}
            <DeleteGuardDialog
              itemLabel={`${student.first_name} ${student.last_name}`}
              id={student.id}
              relations={student._relations ?? []}
              deleteAction={deleteStudent}
              cascadeAction={cascadeDeleteStudentAction}
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

export function StudentsTable({ role, data }: { role: Role; data: Student[] }) {
  return <DataTable columns={getColumns(role)} data={data} />
}