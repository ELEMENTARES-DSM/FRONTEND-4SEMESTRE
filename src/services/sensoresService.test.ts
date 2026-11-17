import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSensor, getSensoresByEstacao } from './sensoresService'

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
