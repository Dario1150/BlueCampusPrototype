"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Banknote, CircleDollarSign } from "lucide-react"
import PageHeader from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { paySalary } from "./actions"

type PendingRow = {
    id: number
    amount: number
    date: string
    lesson: { id: number; date: string; course: { name: string } | null } | null
}
type PaidRow = { id: number; amount: number; date: string; description: string | null }

type Props = {
    instructor: { id: number; first_name: string; last_name: string }
    pending: PendingRow[]
    paid: PaidRow[]
}

function formatMoney(value: number) {
    return value.toFixed(2)
}

export default function SalaryBoard({ instructor, pending, paid }: Props) {
    const router = useRouter()
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPaying, startPaying] = useTransition()

    const name = `${instructor.first_name} ${instructor.last_name}`
    const total = pending.reduce((sum, row) => sum + Number(row.amount), 0)

    function handlePay() {
        setError(null)
        startPaying(async () => {
            try {
                const formData = new FormData()
                formData.set("instructor_id", String(instructor.id))
                await paySalary(formData)
                router.refresh()
                setConfirmOpen(false)
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not process this payment.")
            }
        })
    }

    return (
        <div className="container mx-auto py-10">
            <Link href="/instructors" className="text-sm text-primary underline-offset-4 hover:underline">
                ← Back to instructors
            </Link>

            <div className="pt-3">
                <PageHeader icon={Banknote} title={name} subtitle="Salary">
                    <Button disabled={pending.length === 0} onClick={() => setConfirmOpen(true)}>
                        <CircleDollarSign className="size-4" />
                        Pay {formatMoney(total)}
                    </Button>
                </PageHeader>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h2 className="font-heading pb-4 text-lg font-semibold">Pending</h2>

                {pending.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pending salary right now.</p>
                ) : (
                    <>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                                    <th className="py-2 font-semibold">Date</th>
                                    <th className="py-2 font-semibold">Course</th>
                                    <th className="py-2 text-right font-semibold">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.map((row) => (
                                    <tr key={row.id} className="border-b last:border-0">
                                        <td className="py-2">{formatDate(row.lesson?.date ?? row.date)}</td>
                                        <td className="py-2 text-muted-foreground">{row.lesson?.course?.name ?? "—"}</td>
                                        <td className="py-2 text-right font-medium">{formatMoney(Number(row.amount))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="flex items-center justify-between pt-3">
                            <span className="text-sm font-medium">Total</span>
                            <span className="font-semibold">{formatMoney(total)}</span>
                        </div>
                    </>
                )}
            </div>

            {paid.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="font-heading pb-4 text-lg font-semibold">Payment history</h2>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left text-xs tracking-wide text-muted-foreground uppercase">
                                <th className="py-2 font-semibold">Date</th>
                                <th className="py-2 font-semibold">Description</th>
                                <th className="py-2 text-right font-semibold">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paid.map((row) => (
                                <tr key={row.id} className="border-b last:border-0">
                                    <td className="py-2">{formatDate(row.date)}</td>
                                    <td className="py-2 text-muted-foreground">{row.description ?? "—"}</td>
                                    <td className="py-2 text-right font-medium">{formatMoney(Number(row.amount))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AlertDialog
                open={confirmOpen}
                onOpenChange={(open) => {
                    if (isPaying) return
                    setConfirmOpen(open)
                    if (!open) setError(null)
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pay {name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This records a payout of {formatMoney(total)} for {pending.length} lesson
                            {pending.length === 1 ? "" : "s"} and clears the pending balance.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPaying}>Cancel</AlertDialogCancel>
                        <Button disabled={isPaying} onClick={handlePay}>
                            {isPaying ? "Processing…" : "Confirm payment"}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
