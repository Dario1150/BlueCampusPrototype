import type { LucideIcon } from "lucide-react"

type Props = {
    icon: LucideIcon
    title: string
    subtitle?: string
    children?: React.ReactNode
}

export default function PageHeader({ icon: Icon, title, subtitle, children }: Props) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
            <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                </div>
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
                    {subtitle && (
                        <p className="font-mono text-xs tracking-wide text-muted-foreground">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {children}
        </div>
    )
}
