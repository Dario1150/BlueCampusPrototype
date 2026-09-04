"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export type Relation = {
    label: string
    href: string
}

type Props = {
    itemLabel: string
    id: number | string
    relations: Relation[]
    deleteAction: (formData: FormData) => Promise<void>
    cascadeAction?: (formData: FormData) => Promise<void>
    fieldName?: string
}

export default function DeleteGuardDialog({
    itemLabel,
    id,
    relations,
    deleteAction,
    cascadeAction,
    fieldName = "id",
}: Props) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const hasRelations = relations.length > 0

    function runDelete(action: (formData: FormData) => Promise<void>) {
        setError(null)
        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.set(fieldName, String(id))
                await action(formData)
                router.refresh()
                setOpen(false)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not delete this record.")
            }
        })
    }

    return (
        <>
            <DropdownMenuItem
                variant="destructive"
                onSelect={(e) => {
                    e.preventDefault()
                    setError(null)
                    setOpen(true)
                }}
            >
                Delete
            </DropdownMenuItem>

            <AlertDialog
                open={open}
                onOpenChange={(next) => {
                    if (isPending) return
                    setOpen(next)
                    if (!next) setError(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {hasRelations ? `${itemLabel} has related records` : `Delete ${itemLabel}?`}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="flex flex-col gap-3 text-left">
                                {hasRelations ? (
                                    <>
                                        <p>
                                            This record is still linked to other data. You can delete
                                            everything together, or go review what depends on it first.
                                        </p>
                                        <ul className="flex flex-col gap-1.5">
                                            {relations.map((relation) => (
                                                <li
                                                    key={relation.label}
                                                    className="flex items-center justify-between gap-2 rounded-md bg-muted px-2.5 py-1.5 text-sm text-foreground"
                                                >
                                                    <span>{relation.label}</span>
                                                    <Button asChild variant="outline" size="xs">
                                                        <Link href={relation.href} onClick={() => setOpen(false)}>
                                                            View
                                                        </Link>
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ) : (
                                    <p>This action cannot be undone.</p>
                                )}
                                {error && <p className="text-destructive">{error}</p>}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        {hasRelations
                            ? cascadeAction && (
                                  <Button
                                      variant="destructive"
                                      disabled={isPending}
                                      onClick={() => runDelete(cascadeAction)}
                                  >
                                      Delete everything
                                  </Button>
                              )
                            : (
                                  <Button
                                      variant="destructive"
                                      disabled={isPending}
                                      onClick={() => runDelete(deleteAction)}
                                  >
                                      Delete
                                  </Button>
                              )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
