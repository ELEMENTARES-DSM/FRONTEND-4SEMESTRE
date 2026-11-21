
import type {
    IqarResponse,
    PeriodoAnalise,
    SeriesResponse,
    UltimasLeiturasResponse,
} from '../services/analise/analise.service'

const intervalos: Record<PeriodoAnalise, number> = {
    '24h': 5 * 60 * 1000,
    '7d': 60 * 60 * 1000,
    '30d': 24 * 60 * 60 * 1000,
}

const quantidades: Record<PeriodoAnalise, number> = {
    '24h': 288,
    '7d': 168,
    '30d': 30,
}

const valoresBase: Record<string, number> = {
    PM25: 18,
    'PM2.5': 18,
    PM10: 32,
    O3: 45,
    NO2: 20,
    CO: 0.8,
    SO2: 12,
    Temperatura: 24.5,
    'Umidade Relativa': 62,
    'Velocidade do Vento': 14.2,
    'Direção do Vento': 180,
    Precipitação: 0.4,
    'Pressão Atmosférica': 1013.2,
}

const unidades: Record<string, string> = {
    PM25: 'µg/m³',
    'PM2.5': 'µg/m³',
    PM10: 'µg/m³',
    O3: 'µg/m³',
    NO2: 'µg/m³',
    CO: 'ppm',
    SO2: 'µg/m³',
    Temperatura: '°C',
    'Umidade Relativa': '%',
    'Velocidade do Vento': 'km/h',
    'Direção do Vento': '°',
    Precipitação: 'mm',
    'Pressão Atmosférica': 'hPa',
}

export function criarMockSeries(
    estacaoId: string,
    grandeza: string,
    periodo: PeriodoAnalise,
): SeriesResponse {
    const quantidade = quantidades[periodo]
    const intervalo = intervalos[periodo]
    const valorBase = valoresBase[grandeza] ?? 20
    const agora = Date.now()

    const dados = Array.from({ length: quantidade }, (_, indice) => {
        const timestamp = new Date(
            agora - (quantidade - 1 - indice) * intervalo,
        ).toISOString()

        const variacao = Math.sin(indice / 8) * valorBase * 0.2
        const oscilacao = Math.cos(indice / 3) * valorBase * 0.08

        return {
            timestamp,
            valor: Number((valorBase + variacao + oscilacao).toFixed(2)),
        }
    })

    return {
        estacaoId,
        grandeza,
        periodo,
        dados,
    }
}

export function criarMockUltimasLeituras(
    estacaoId: string,
): UltimasLeiturasResponse {
    const leituras = ['PM25', 'PM10', 'O3'].map((grandeza) => ({
        grandeza,
        valorCalibrado: valoresBase[grandeza],
        unidade: unidades[grandeza],
        tempoRelativo: 'Há 2 minutos',
    }))

    return {
        estacaoId,
        leituras,
    }
}

export const mockIqar: IqarResponse = {
    status: 'Boa',
    cor: '#00E400',
    rotuloFaixa: 'Boa',
    mensagem: 'Qualidade do ar considerada boa.',
}
