import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  atualizarGrandeza,
  criarGrandeza,
  excluirGrandeza,
  listarGrandezas,
} from './tiposSensorService'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../api/instance', () => ({ default: http }))

const grandeza = {
  id: 'g-1',
  nome: 'Radiação Solar',
  unidade: 'W/m²',
  faixa_min: '0.00',
  faixa_max: '1500.00',
  agregacao: 'media',
}

beforeEach(() => vi.resetAllMocks())

describe('tiposSensorService: catálogo de grandezas (US-39)', () => {
  it('lista as grandezas em GET /estacoes/tipos-sensor e devolve como vieram', async () => {
    http.get.mockResolvedValueOnce({ data: [grandeza] })

    await expect(listarGrandezas()).resolves.toEqual([grandeza])
    expect(http.get).toHaveBeenCalledWith('/estacoes/tipos-sensor')
  })

  it('cria a grandeza em POST /estacoes/tipos-sensor com os campos do contrato', async () => {
    http.post.mockResolvedValueOnce({ data: grandeza })

    await criarGrandeza({ nome: 'Radiação Solar', unidade: 'W/m²', faixa_min: 0, faixa_max: 1500, agregacao: 'media' })

    expect(http.post).toHaveBeenCalledWith('/estacoes/tipos-sensor', {
      nome: 'Radiação Solar', unidade: 'W/m²', faixa_min: 0, faixa_max: 1500, agregacao: 'media',
    })
  })

  it('altera sem enviar o nome, em PUT /estacoes/tipos-sensor/:id', async () => {
    http.put.mockResolvedValueOnce({ data: grandeza })

    await atualizarGrandeza('g-1', { unidade: 'W/m²', faixa_max: 800 })

    expect(http.put).toHaveBeenCalledWith('/estacoes/tipos-sensor/g-1', { unidade: 'W/m²', faixa_max: 800 })
  })

  it('exclui em DELETE /estacoes/tipos-sensor/:id', async () => {
    http.delete.mockResolvedValueOnce({})

    await excluirGrandeza('g-1')

    expect(http.delete).toHaveBeenCalledWith('/estacoes/tipos-sensor/g-1')
  })

  it('deixa o erro da API subir para a tela mostrar a mensagem', async () => {
    const erro = Object.assign(new Error('Conflict'), { response: { status: 409, data: { message: 'em uso' } } })
    http.delete.mockRejectedValueOnce(erro)

    await expect(excluirGrandeza('g-1')).rejects.toBe(erro)
  })
})
