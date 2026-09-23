import { Card } from '../../shared/components/Card'

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
    const cards = [
        { label: 'Total de Estações', value: total, tone: 'text-blue-400' },
        { label: 'Online / Ativas', value: ativas, tone: 'text-green-400' },
        { label: 'Com Falha', value: comFalha, tone: 'text-red-400' },
        { label: 'Inativas', value: inativas, tone: 'text-gray-400' },
    ]

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <Card
                    key={card.label}
                    noBody
                    className="border border-line bg-[#111C38] shadow-sm"
                >
                    <div className="space-y-2 p-5">
                        <span className="text-sm text-gray-400">{card.label}</span>
                        <strong className={`block text-3xl ${card.tone}`}>
                            {card.value}
                        </strong>
                    </div>
                </Card>
            ))}
        </div>
    )
}