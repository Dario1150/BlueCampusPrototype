"use client"

import { useTransition } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Eye, EyeOff } from "lucide-react"
import { ArrowUpDown } from "lucide-react"
import { deleteSchool, cascadeDeleteSchoolAction, setActiveSchool } from "./actions"
import Link from "next/link"
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
import { DataTable } from "./data-table"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type School = {
  id: string
  name: string
  email: string
  phone: string
  website: string
  adress: string
  city: string
  country: string
  _relations?: Relation[]
}

function ActiveSchoolMenuItem({ schoolId, isActive }: { schoolId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition()

  function toggle() {
    const formData = new FormData()
    if (!isActive) formData.set("school_id", schoolId)
    startTransition(() => {
      setActiveSchool(formData)
    })
  }

  return (
    <DropdownMenuItem
      onSelect={(e) => {
        e.preventDefault()
        toggle()
      }}
      disabled={isPending}
    >
      {isActive ? (
        <>
          <EyeOff className="mr-2 h-4 w-4" />
          Stop viewing this school
        </>
      ) : (
        <>
          <Eye className="mr-2 h-4 w-4" />
          Display data for this school
        </>
      )}
    </DropdownMenuItem>
  )
}

export function getColumns(activeSchoolId: number | null): ColumnDef<School>[] {
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
    cell: ({ row }) => {
      const school = row.original
      const isActive = activeSchoolId != null && Number(school.id) === activeSchoolId
      return (
        <div className="flex items-center gap-2">
          {school.name}
          {isActive && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Viewing
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "website",
    header: "Website"
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "email",
    header: "EMail"
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const school = row.original
      const isActive = activeSchoolId != null && Number(school.id) === activeSchoolId

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
            <ActiveSchoolMenuItem schoolId={school.id} isActive={isActive} />
            <DropdownMenuItem>Info</DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/schools/${school.id}/edit`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <DeleteGuardDialog
              itemLabel={school.name}
              id={school.id}
              relations={school._relations ?? []}
              deleteAction={deleteSchool}
              cascadeAction={cascadeDeleteSchoolAction}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  ]
}

export function SchoolsTable({ activeSchoolId, data }: { activeSchoolId: number | null; data: School[] }) {
  return <DataTable columns={getColumns(activeSchoolId)} data={data} />
}
