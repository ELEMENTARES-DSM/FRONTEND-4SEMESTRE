import { Card } from '../../shared/components/Card'

export function KpiCardsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card
                    key={index}
                    noBody
                    className="border border-line bg-[#111C38] shadow-sm"
                >
                    <div className="space-y-3 p-5">
                        <div className="skeleton h-4 w-24 rounded bg-base-300/70" />
                        <div className="skeleton h-8 w-16 rounded bg-base-300/70" />
                    </div>
                </Card>
            ))}
        </div>
    )
}