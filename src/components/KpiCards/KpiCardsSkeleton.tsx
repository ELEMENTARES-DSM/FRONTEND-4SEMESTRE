export function KpiCardsSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
                <div
                    key={index}
                    className="skeleton h-32 w-full bg-[#111C38]"
                />
            ))}
        </div>
    )
}