import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSensor, getSensoresByEstacao, getSensoresDetectados, getTiposSensor } from './sensoresService'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}))

vi.mock('../api/instance', () => ({ default: http }))

const ESTACAO = '11111111-1111-4111-8111-111111111111'

// Como o gestao-estacoes devolve: NUMERIC chega como texto, com 6 casas.
const respostaDoSensor = {
  id: 's-1',
  estacao_id: ESTACAO,
  codigo: 'TEMP-K',
  nome: 'Termômetro em Kelvin',
  tipo: 'Temperatura',
  unidade_medida: '°C',
  fator_conversao: '1.000000',
  offset: '-273.150000',
  status: 'Ativo',
}

beforeEach(() => vi.resetAllMocks())

describe('sensoresService: fator_conversao e offset (US-39)', () => {
  it('lê fator_conversao e offset da resposta e os converte para número', async () => {
    http.get.mockResolvedValueOnce({ data: [respostaDoSensor] })

    const [sensor] = await getSensoresByEstacao(ESTACAO)

    expect(http.get).toHaveBeenCalledWith(`/estacoes/estacoes/${ESTACAO}/sensores`)
    expect(sensor).toMatchObject({ fator_conversao: 1, offset: -273.15, grandeza: 'Temperatura', unidade: '°C' })
    expect(sensor).not.toHaveProperty('fator')
    expect(sensor).not.toHaveProperty('ganho')
  })

  it('envia fator_conversao e offset no cadastro, sem os nomes antigos', async () => {
    http.post.mockResolvedValueOnce({ data: respostaDoSensor })

    const criado = await createSensor(ESTACAO, {
      codigo: 'TEMP-K',
      nome: 'Termômetro em Kelvin',
      tipo: 'Temperatura',
      fator_conversao: 1,
      offset: -273.15,
    })

    const [rota, corpo] = http.post.mock.calls[0]
    expect(rota).toBe(`/estacoes/estacoes/${ESTACAO}/sensores`)
    expect(corpo).toEqual({
      codigo: 'TEMP-K',
      nome: 'Termômetro em Kelvin',
      tipo: 'Temperatura',
      fator_conversao: 1,
      offset: -273.15,
    })
    expect(corpo).not.toHaveProperty('fator')
    expect(corpo).not.toHaveProperty('ganho')
    expect(criado.offset).toBe(-273.15)
  })
})

describe('sensoresService: catálogo e unidade da leitura (US-39)', () => {
  it('busca as grandezas em GET /estacoes/tipos-sensor e devolve a lista como veio', async () => {
    const catalogo = [
      { id: 'g-1', nome: 'Direção do Vento', unidade: '°', faixa_min: '0.00', faixa_max: '360.00', agregacao: 'media_circular' },
      { id: 'g-2', nome: 'Precipitação', unidade: 'mm', faixa_min: '0.00', faixa_max: '500.00', agregacao: 'soma' },
    ]
    http.get.mockResolvedValueOnce({ data: catalogo })

    await expect(getTiposSensor()).resolves.toEqual(catalogo)
    expect(http.get).toHaveBeenCalledWith('/estacoes/tipos-sensor')
  })

  it('deixa o erro da busca subir para a tela mostrar o aviso', async () => {
    http.get.mockRejectedValueOnce(new Error('Network Error'))

    await expect(getTiposSensor()).rejects.toThrow('Network Error')
  })

  it('lê unidade_leitura da resposta e usa null quando o sensor não tem (sensor antigo)', async () => {
    http.get.mockResolvedValueOnce({
      data: [
        { ...respostaDoSensor, unidade_leitura: 'K' },
        { ...respostaDoSensor, id: 's-2', codigo: 'UMID-01' },
        { ...respostaDoSensor, id: 's-3', codigo: 'PM-01', unidade_leitura: null },
      ],
    })

    const sensores = await getSensoresByEstacao(ESTACAO)

    expect(sensores.map((s) => s.unidade_leitura)).toEqual(['K', null, null])
  })

  it('envia unidade_leitura só quando ela é informada', async () => {
    http.post.mockResolvedValue({ data: respostaDoSensor })
    const base = { codigo: 'TEMP-K', nome: 'Termômetro', tipo: 'Temperatura', fator_conversao: 1, offset: -273.15 }

    await createSensor(ESTACAO, { ...base, unidade_leitura: 'K' })
    await createSensor(ESTACAO, base)

    expect(http.post.mock.calls[0][1]).toHaveProperty('unidade_leitura', 'K')
    expect(http.post.mock.calls[1][1]).not.toHaveProperty('unidade_leitura')
  })
})

describe('sensoresService: códigos recebidos sem sensor (US-39)', () => {
  it('busca os códigos detectados da estação no caminho real e devolve a lista como veio', async () => {
    const lista = [{ codigo: 'PM25', total: 12, ultimo_valor: 12, ultima_leitura_em: '2026-11-17T17:20:00.000Z' }]
    http.get.mockResolvedValueOnce({ data: lista })

    await expect(getSensoresDetectados(ESTACAO)).resolves.toEqual(lista)
    expect(http.get).toHaveBeenCalledWith(`/estacoes/estacoes/${ESTACAO}/sensores/detectados`)
  })

  it('deixa o erro da busca subir para a tela mostrar o aviso', async () => {
    http.get.mockRejectedValueOnce(new Error('Network Error'))

    await expect(getSensoresDetectados(ESTACAO)).rejects.toThrow('Network Error')
  })
})
