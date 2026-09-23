interface KpiCardsProps {
    total: number
    ativas: number
    comFalha: number
    inativas: number
}

export function KpiCards({
    total,
    ativas,
    comFalha,
    inativas,
}: KpiCardsProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="card bg-[#111C38] shadow">
                <div className="card-body">
                    <span className="text-sm text-gray-400">
                        Total de Estações
                    </span>

                    <strong className="text-3xl text-blue-400">
                        {total}
                    </strong>
                </div>
            </div>

            <div className="card bg-[#111C38] shadow">
                <div className="card-body">
                    <span className="text-sm text-gray-400">
                        Online / Ativas
                    </span>

                    <strong className="text-3xl text-green-400">
                        {ativas}
                    </strong>
                </div>
            </div>

            <div className="card bg-[#111C38] shadow">
                <div className="card-body">
                    <span className="text-sm text-gray-400">
                        Com Falha
                    </span>

                    <strong className="text-3xl text-red-400">
                        {comFalha}
                    </strong>
                </div>
            </div>

            <div className="card bg-[#111C38] shadow">
                <div className="card-body">
                    <span className="text-sm text-gray-400">
                        Inativas
                    </span>

                    <strong className="text-3xl text-gray-400">
                        {inativas}
                    </strong>
                </div>
            </div>
        </div>
    )
}