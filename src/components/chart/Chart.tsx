
import {
    CartesianGrid,
    Line,
    LineChart,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { formatarData } from './chart.utils'

export interface ChartPoint {
    timestamp: string
    valor: number
}

export interface ChartSeries {
    label: string
    dados: ChartPoint[]
    cor?: string
}

interface ChartProps {
    series: ChartSeries[]
    unidade: string
    titulo?: string
    ocultarTituloVisual?: boolean
    rotuloEixoX?: string
    rotuloEixoY?: string
    altura?: number
}

interface PontoFormatado {
    timestamp: string
    [key: string]: string | number
}

const PALETA_CORES = [
    '#2DD4BF',
    '#60A5FA',
    '#F59E0B',
    '#F87171',
    '#A78BFA',
]

function formatarValor(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 2,
    }).format(valor)
}

function TooltipPersonalizado({
    active,
    payload,
    label,
    unidade,
}: TooltipContentProps & {
    unidade: string
}) {
    if (!active || !payload?.length) {
        return null
    }

    return (
        <div className="rounded-lg border border-[#2DD4BF]/40 bg-[#101C2C] px-4 py-3 shadow-lg">
            <p className="mb-2 text-xs text-slate-400">
                {typeof label === 'string' ? formatarData(label) : ''}
            </p>

            {payload.map((item) => (
                <p
                    key={item.dataKey?.toString()}
                    className="text-sm font-medium text-white"
                >
                    <span style={{ color: item.color }}>
                        {item.name}:{' '}
                    </span>
                    {typeof item.value === 'number'
                        ? formatarValor(item.value)
                        : '—'}{' '}
                    {unidade}
                </p>
            ))}
        </div>
    )
}

export default function Chart({
    series,
    unidade,
    titulo,
    ocultarTituloVisual = false,
    rotuloEixoX = 'Data e horário',
    rotuloEixoY = 'Valor',
    altura = 320,
}: ChartProps) {
    const timestamps = Array.from(
        new Set(
            series.flatMap((item) =>
                item.dados.map((ponto) => ponto.timestamp),
            ),
        ),
    ).sort(
        (a, b) =>
            new Date(a).getTime() - new Date(b).getTime(),
    )

    const dados: PontoFormatado[] = timestamps.map(
        (timestamp) => {
            const ponto: PontoFormatado = { timestamp }

            series.forEach((item, index) => {
                const valor = item.dados.find(
                    (dado) => dado.timestamp === timestamp,
                )?.valor

                ponto[`serie${index}`] = valor ?? Number.NaN
            })

            return ponto
        },
    )

    if (series.length === 0 || timestamps.length === 0) {
        return (
            <div
                className="flex items-center justify-center rounded-lg border border-base-300 p-8 text-base-content/60"
                style={{ minHeight: altura }}
                role="status"
            >
                Não há dados disponíveis para exibir.
            </div>
        )
    }

    return (
        <section
            className="w-full"
            aria-label={titulo ?? 'Gráfico de séries temporais'}
        >
            {titulo && !ocultarTituloVisual && (
                <h3 className="mb-3 text-sm font-semibold text-slate-200">
                    {titulo}
                </h3>
            )}

            <div style={{ width: '100%', height: altura }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={dados}
                        margin={{
                            top: 12,
                            right: 16,
                            bottom: 12,
                            left: 8,
                        }}
                    >
                        <CartesianGrid
                            stroke="#334155"
                            strokeDasharray="3 3"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="timestamp"
                            tickFormatter={(valor: string) =>
                                formatarData(valor, false)
                            }
                            tick={{ fill: '#94A3B8', fontSize: 11 }}
                            axisLine={{ stroke: '#475569' }}
                            tickLine={false}
                            minTickGap={32}
                            label={{
                                value: rotuloEixoX,
                                position: 'insideBottom',
                                offset: -8,
                                fill: '#94A3B8',
                                fontSize: 11,
                            }}
                        />

                        <YAxis
                            tick={{ fill: '#94A3B8', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                            label={{
                                value: unidade
                                    ? `${rotuloEixoY} (${unidade})`
                                    : rotuloEixoY,
                                angle: -90,
                                position: 'insideLeft',
                                fill: '#94A3B8',
                                fontSize: 11,
                            }}
                        />

                        <Tooltip
                            content={(props) => (
                                <TooltipPersonalizado
                                    {...props}
                                    unidade={unidade}
                                />
                            )}
                        />

                        {series.length > 1 && (
                            <Legend
                                verticalAlign="top"
                                align="center"
                                height={24}
                                wrapperStyle={{
                                    color: '#CBD5E1',
                                    fontSize: 12,
                                }}
                            />
                        )}

                        {series.map((item, index) => (
                            <Line
                                key={`${item.label}-${index}`}
                                type="monotone"
                                dataKey={`serie${index}`}
                                name={item.label}
                                stroke={
                                    item.cor ??
                                    PALETA_CORES[index % PALETA_CORES.length]
                                }
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                                activeDot={{
                                    r: 5,
                                    stroke: '#101C2C',
                                    strokeWidth: 2,
                                }}
                                connectNulls={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </section>
    )
}
