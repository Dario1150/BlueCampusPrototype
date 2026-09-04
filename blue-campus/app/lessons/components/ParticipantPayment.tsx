"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { addLessonPayment } from "@/app/transactions/actions"

type Payment = {
    id: number
    amount: number
    type: string
    status: string | null
}

type Option = { id: number; first_name?: string; last_name?: string }

type Props = {
    lessonId: number
    lessonDate: string
    studentId: number
    defaultInstructorId?: number
    payments: Payment[]
    instructors: Option[]
}

const TYPES = ["Cash", "Card", "Twint", "Bank Transfer"]
const STATUSES = ["Paid", "Pending", "Refunded"]

export default function ParticipantPayment({
    lessonId,
    lessonDate,
    studentId,
    defaultInstructorId,
    payments,
    instructors,
}: Props) {
    const router = useRouter()
    const [isAdding, setIsAdding] = useState(false)

    async function handleSubmit(formData: FormData) {
        await addLessonPayment(formData)
        router.refresh()
        setIsAdding(false)
    }

    if (isAdding) {
        return (
            <form action={handleSubmit} className="flex w-full flex-col gap-2 rounded-lg border bg-muted/40 p-3">
                <input type="hidden" name="lesson_id" value={lessonId} />
                <input type="hidden" name="student_id" value={studentId} />
                <input type="hidden" name="date" value={lessonDate} />
                <input type="hidden" name="category" value="Lesson Fee" />

                <div className="grid grid-cols-2 gap-2">
                    <Input name="amount" type="number" step="0.01" placeholder="Amount" required />
                    <Select name="type" required>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Method" />
                        </SelectTrigger>
                        <SelectContent>
                            {TYPES.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Select name="instructor_id" defaultValue={defaultInstructorId?.toString()} required>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Received by" />
                        </SelectTrigger>
                        <SelectContent>
                            {instructors.map((instructor) => (
                                <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                    {instructor.first_name} {instructor.last_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select name="status" defaultValue="Paid" required>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="xs" onClick={() => setIsAdding(false)}>
                        Cancel
                    </Button>
                    <Button type="submit" size="xs">
                        Save payment
                    </Button>
                </div>
            </form>
        )
    }

    return (
        <div className="flex items-center gap-2">
            {payments.map((payment) => (
                <span key={payment.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2 py-0.5">{payment.status ?? "Unknown"}</span>
                    <span>{payment.amount} · {payment.type}</span>
                </span>
            ))}
            <Button type="button" variant="outline" size="xs" onClick={() => setIsAdding(true)}>
                <Plus className="size-3" />
                Payment
            </Button>
        </div>
    )
}
