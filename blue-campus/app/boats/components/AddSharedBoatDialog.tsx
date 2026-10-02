"use client"

import { useState, useTransition } from "react"
import { Share2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { linkSharedBoat } from "../actions"

export default function AddSharedBoatDialog() {
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [addedName, setAddedName] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            try {
                const name = await linkSharedBoat(formData)
                setAddedName(name ?? "the boat")
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not add the boat.")
            }
        })
    }

    function handleOpenChange(next: boolean) {
        if (isPending) return
        setOpen(next)
        if (!next) {
            setError(null)
            setAddedName(null)
        }
    }

    return (
        <>
            <Button type="button" variant="outline" onClick={() => setOpen(true)}>
                <Share2 />
                Add shared boat
            </Button>

            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a shared boat</DialogTitle>
                        <DialogDescription>
                            Enter the boat code the owning school gave you. You&apos;ll be able to book lessons on
                            that boat, and double bookings with the other school are prevented automatically.
                        </DialogDescription>
                    </DialogHeader>

                    {addedName ? (
                        <>
                            <p className="text-sm text-emerald-700">
                                Added {addedName}. It now appears in your boats and lesson forms.
                            </p>
                            <DialogFooter>
                                <Button type="button" onClick={() => handleOpenChange(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <form action={handleSubmit} className="flex flex-col gap-4">
                            <Field>
                                <FieldLabel htmlFor="boat-code">Boat code</FieldLabel>
                                <Input
                                    id="boat-code"
                                    name="code"
                                    type="text"
                                    placeholder="ABCDE-FGHJK"
                                    autoComplete="off"
                                    className="font-mono uppercase"
                                    required
                                />
                            </Field>
                            {error && <p className="text-sm text-destructive">{error}</p>}
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => handleOpenChange(false)}
                                    disabled={isPending}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    Add boat
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
