import { Anchor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { login } from "./actions"

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const { error } = await searchParams

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex flex-col items-center gap-2 pb-6 text-center">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Anchor className="size-5" />
                    </div>
                    <h1 className="font-heading text-xl font-bold">Blue Campus</h1>
                    <p className="text-sm text-muted-foreground">Sign in to continue</p>
                </div>

                <form action={login} className="flex flex-col gap-4">
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input id="email" name="email" type="email" required autoFocus />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input id="password" name="password" type="password" required />
                        </Field>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button type="submit" className="w-full">
                            Sign in
                        </Button>
                    </FieldGroup>
                </form>
            </div>
        </div>
    )
}
