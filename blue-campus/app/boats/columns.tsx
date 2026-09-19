"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { deleteBoat, cascadeDeleteBoatAction } from "./actions"
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

export type Boat = {
    id: string
    name: string
    type: string
    capacity: number
    registration_number: string
    notes: string
    school_id: string
    _relations?: Relation[]
  }

export function getColumns(role: Role): ColumnDef<Boat>[] {
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
    accessorKey: "type",
    header: "Type"
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
  },
  {
    accessorKey: "registration_number",
    header: "Registration Number"
  },
  ...(canWrite ? [{
    id: "actions",
    cell: ({ row }: { row: { original: Boat } }) => {
      const boat = row.original

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
              <Link href={`/boats/${boat.id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <DeleteGuardDialog
              itemLabel={boat.name}
              id={boat.id}
              relations={boat._relations ?? []}
              deleteAction={deleteBoat}
              cascadeAction={cascadeDeleteBoatAction}
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

// getColumns() can only run in a client context (it's exported from a "use
// client" module) — this wrapper lets a Server Component page.tsx render
// the table with a role-appropriate column set without calling it directly.
export function BoatsTable({ role, data }: { role: Role; data: Boat[] }) {
  return <DataTable columns={getColumns(role)} data={data} />
}