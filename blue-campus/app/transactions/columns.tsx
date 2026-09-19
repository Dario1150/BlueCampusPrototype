"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { deleteTransaction } from "./actions"
import { formatDate } from "@/lib/utils"
import DeleteGuardDialog from "@/components/delete-guard-dialog"
import type { Role } from "@/lib/auth/current-profile"
import { DataTable } from "./data-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Transaction = {
  id: string
  date: string
  amount: number
  type: string
  category: string
  status: string | null
  description: string | null
  student: { id: string; first_name: string; last_name: string } | null
  instructor: { id: string; first_name: string; last_name: string } | null
  boat: { id: string; name: string } | null
}

export function getColumns(role: Role): ColumnDef<Transaction>[] {
  const canWrite = role === "admin" || role === "school" || role === "instructor"

  return [
  {
    id: "student_name",
    accessorFn: (row) =>
      row.student ? `${row.student.first_name} ${row.student.last_name}` : "—",
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
    id: "instructor_name",
    accessorFn: (row) =>
      row.instructor ? `${row.instructor.first_name} ${row.instructor.last_name}` : "Unassigned",
    header: "Instructor",
  },
  {
    id: "boat_name",
    accessorFn: (row) => row.boat?.name ?? "—",
    header: "Boat",
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date),
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "type",
    header: "Method",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  ...(canWrite ? [{
    id: "actions",
    cell: ({ row }: { row: { original: Transaction } }) => {
      const transaction = row.original

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
              <Link href={`/transactions/${transaction.id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <DeleteGuardDialog
              itemLabel="this transaction"
              id={transaction.id}
              relations={[]}
              deleteAction={deleteTransaction}
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

export function TransactionsTable({ role, data }: { role: Role; data: Transaction[] }) {
  return <DataTable columns={getColumns(role)} data={data} />
}
