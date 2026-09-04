"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { deleteBoat, cascadeDeleteBoatAction } from "./actions"
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

export const columns: ColumnDef<Boat>[] = [
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
  {
    id: "actions",
    cell: ({ row }) => {
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
  },
]