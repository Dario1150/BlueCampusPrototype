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
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { createStudentAccount, resendStudentAccountAccess } from "../actions"

type Props = {
    studentId: number
    studentName: string
    defaultEmail: string
    account: { email: string } | null
}

export default function AccountDialog({ studentId, studentName, defaultEmail, account }: Props) {
    const [open, setOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleCreate(formData: FormData) {
        setError(null)
        startTransition(async () => {
            try {
                formData.set("student_id", studentId.toString())
                await createStudentAccount(formData)
                setSent(true)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not create the account.")
            }
        })
    }

    function handleResend() {
        if (!account) return
        setError(null)
        startTransition(async () => {
            try {
                const formData = new FormData()
                formData.set("email", account.email)
                await resendStudentAccountAccess(formData)
                setSent(true)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not send the email.")
            }
        })
    }

    return (
        <>
            <DropdownMenuItem
                onSelect={(e) => {
                    e.preventDefault()
                    setError(null)
                    setSent(false)
                    setOpen(true)
                }}
            >
                Create account
            </DropdownMenuItem>

            <Dialog open={open} onOpenChange={(next) => { if (!isPending) setOpen(next) }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {account ? "Account already exists" : `Create an account for ${studentName}`}
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="flex flex-col gap-3 text-left">
                                {account ? (
                                    <p>
                                        {studentName} already has a login (
                                        <span className="font-medium text-foreground">{account.email}</span>
                                        ). You can resend them an access email, or cancel.
                                    </p>
                                ) : (
                                    <p>
                                        {studentName} will receive an email invite to set up their own password and log in.
                                    </p>
                                )}
                                {sent && (
                                    <p className="text-emerald-700">
                                        {account ? "Access email sent." : "Invite sent."}
                                    </p>
                                )}
                                {error && <p className="text-destructive">{error}</p>}
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    {!account && !sent && (
                        <form action={handleCreate} className="flex flex-col gap-4">
                            <Field>
                                <FieldLabel htmlFor="account-email">Email</FieldLabel>
                                <Input
                                    id="account-email"
                                    name="email"
                                    type="email"
                                    defaultValue={defaultEmail}
                                    placeholder="student@example.com"
                                    required
                                />
                            </Field>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    Send invite
                                </Button>
                            </DialogFooter>
                        </form>
                    )}

                    {account && !sent && (
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={handleResend} disabled={isPending}>
                                Resend access email
                            </Button>
                        </DialogFooter>
                    )}

                    {sent && (
                        <DialogFooter>
                            <Button type="button" onClick={() => setOpen(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
