
import { beforeEach, describe, expect, it, vi } from 'vitest'
import api from '../../api/instance'
import {
  getIqar,
  getSeriesEstacao,
  getUltimasLeituras,
} from './analise.service'

vi.mock('../../api/instance', () => ({
  default: {
    get: vi.fn(),
  },
}))

describe('Serviço de análise de dados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSeriesEstacao', () => {
    it('deve buscar a série temporal de uma estação com os parâmetros informados', async () => {
      const resposta = {
        estacaoId: 'estacao-1',
        grandeza: 'PM25',
        periodo: '24h' as const,
        dados: [
          {
            timestamp: '2026-11-16T12:00:00.000Z',
            valor: 18.5,
          },
          {
            timestamp: '2026-11-16T13:00:00.000Z',
            valor: 20.2,
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({
        data: resposta,
      } as never)

      const resultado = await getSeriesEstacao(
        'estacao-1',
        'PM25',
        '24h',
      )

      expect(api.get).toHaveBeenCalledWith(
        '/analise/estacoes/estacao-1/series',
        {
          params: {
            grandeza: 'PM25',
            periodo: '24h',
          },
        },
      )

      expect(resultado).toEqual(resposta)
    })
  })

  describe('getUltimasLeituras', () => {
    it('deve buscar as últimas leituras de uma estação', async () => {
      const resposta = {
        estacaoId: 'estacao-1',
        leituras: [
          {
            grandeza: 'PM25',
            valorCalibrado: 18,
            unidade: 'µg/m³',
            tempoRelativo: 'Há 2 minutos',
          },
          {
            grandeza: 'PM10',
            valorCalibrado: 32,
            unidade: 'µg/m³',
            tempoRelativo: 'Há 2 minutos',
          },
        ],
      }

      vi.mocked(api.get).mockResolvedValue({
        data: resposta,
      } as never)

      const resultado = await getUltimasLeituras('estacao-1')

      expect(api.get).toHaveBeenCalledWith(
        '/analise/estacoes/estacao-1/ultimas-leituras',
      )

      expect(resultado).toEqual(resposta)
    })
  })

  describe('getIqar', () => {
    it('deve buscar os dados do IQAr', async () => {
      const resposta = {
        status: 'Boa',
        cor: '#00E400',
        rotuloFaixa: 'Boa',
        mensagem: 'Qualidade do ar considerada boa.',
      }

      vi.mocked(api.get).mockResolvedValue({
        data: resposta,
      } as never)

      const resultado = await getIqar()

      expect(api.get).toHaveBeenCalledWith('/analise/iqar')

      expect(resultado).toEqual(resposta)
    })

    it('deve aceitar uma resposta sem cor quando não houver dados suficientes', async () => {
      const resposta = {
        status: 'Sem dados suficientes',
        rotuloFaixa: 'Sem dados suficientes',
        mensagem: 'Não há dados suficientes para calcular o IQAr.',
      }

      vi.mocked(api.get).mockResolvedValue({
        data: resposta,
      } as never)

      const resultado = await getIqar()

      expect(resultado).toEqual(resposta)
      expect(resultado.cor).toBeUndefined()
    })
  })
})
