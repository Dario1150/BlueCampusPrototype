"use client"

import { useState, useTransition } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { setBoatShareCode, removeBoatShare } from "../actions"

type Props = {
    boatId: number
    boatName: string
    shareCode: string | null
    sharedWith: { school_id: number; name: string }[]
}

export default function ShareBoatDialog({ boatId, boatName, shareCode, sharedWith }: Props) {
    const [open, setOpen] = useState(false)
    const [code, setCode] = useState(shareCode)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    function updateCode(mode: "generate" | "disable") {
        setError(null)
        setCopied(false)
        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.set("boat_id", boatId.toString())
                formData.set("mode", mode)
                setCode(await setBoatShareCode(formData))
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not update the code.")
            }
        })
    }

    function removeSchool(schoolId: number) {
        setError(null)
        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.set("boat_id", boatId.toString())
                formData.set("school_id", schoolId.toString())
                await removeBoatShare(formData)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not remove access.")
            }
        })
    }

    async function copyCode() {
        if (!code) return
        try {
            await navigator.clipboard.writeText(code)
            setCopied(true)
        } catch {
            setError("Could not copy automatically — please select and copy the code manually.")
        }
    }

    return (
        <>
            <DropdownMenuItem
                onSelect={(e) => {
                    e.preventDefault()
                    setError(null)
                    setOpen(true)
                }}
            >
                Share boat
            </DropdownMenuItem>

            <Dialog open={open} onOpenChange={(next) => { if (!isPending) setOpen(next) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Share {boatName}</DialogTitle>
                        <DialogDescription>
                            Give this code to another school. Once they add it, both schools can book lessons on
                            this boat and each sees when it&apos;s already taken (without seeing any lesson details).
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3">
                        {code ? (
                            <div className="flex items-center gap-2">
                                <code className="flex-1 rounded-lg border bg-muted px-3 py-2 text-center font-mono text-lg tracking-widest select-all">
                                    {code}
                                </code>
                                <Button type="button" variant="outline" onClick={copyCode}>
                                    {copied ? "Copied" : "Copy"}
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No active code. Create one to let another school add this boat.
                            </p>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" onClick={() => updateCode("generate")} disabled={isPending}>
                                {code ? "Generate new code" : "Create code"}
                            </Button>
                            {code && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateCode("disable")}
                                    disabled={isPending}
                                >
                                    Turn off code
                                </Button>
                            )}
                        </div>
                        {code && (
                            <p className="text-xs text-muted-foreground">
                                A new code stops the old one from working. Schools that already added the boat keep
                                access until you remove them below.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 border-t pt-4">
                        <h3 className="text-sm font-semibold">Schools using this boat</h3>
                        {sharedWith.length === 0 && (
                            <p className="text-sm text-muted-foreground">No other school has added this boat yet.</p>
                        )}
                        {sharedWith.map((school) => (
                            <div
                                key={school.school_id}
                                className="flex items-center justify-between gap-2 rounded-md bg-muted px-2.5 py-1.5 text-sm"
                            >
                                <span>{school.name}</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => removeSchool(school.school_id)}
                                    disabled={isPending}
                                >
                                    Remove access
                                </Button>
                            </div>
                        ))}
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <DialogFooter>
                        <Button type="button" onClick={() => setOpen(false)} disabled={isPending}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
