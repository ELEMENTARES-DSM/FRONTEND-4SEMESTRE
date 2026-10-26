import { afterEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import api from '../../api/instance'
import exemplos from './exemplos-openapi.json'
import { buscarAlarme, buscarResumoAlarmes, listarAlarmes } from './alarms.service'
import { classificarErroAlarmes, MENSAGENS_ERRO_ALARMES } from './alarms.errors'
import type { Alarme, ResumoAlarmes } from '../../types/alarms'

// Fixtures: os exemplos de resposta do OpenAPI do alertas-notificacoes, sem alteração.
const alarme: Alarme = exemplos.alarme as Alarme
const resumo: ResumoAlarmes = exemplos.resumo

const respostaComStatus = (status: number) =>
  new AxiosError('falha', 'ERR_BAD_RESPONSE', undefined, undefined, { status, data: {} } as AxiosResponse)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('alarms.service (US-24)', () => {
  it('lista os alarmes com os filtros preenchidos e devolve o JSON do backend como está', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: [alarme] })

    const lista = await listarAlarmes({
      severidade: 'CRITICO',
      situacao: undefined,
      estacao_id: '',
      de: '2026-10-24T03:00:00.000Z',
    })

    expect(lista).toEqual([alarme])
    expect(get).toHaveBeenCalledWith('/alertas/alarmes', {
      params: { severidade: 'CRITICO', de: '2026-10-24T03:00:00.000Z' },
    })
  })

  it('busca o detalhe pelo id e o resumo dos abertos', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValueOnce({ data: alarme })
      .mockResolvedValueOnce({ data: resumo })

    expect(await buscarAlarme(alarme.id)).toEqual(alarme)
    expect(await buscarResumoAlarmes()).toEqual(resumo)
    expect(get.mock.calls.map(([url]) => url)).toEqual([`/alertas/alarmes/${alarme.id}`, '/alertas/alarmes/resumo'])
  })

  it('recusa resumo fora do formato do backend', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: [] })

    await expect(buscarResumoAlarmes()).rejects.toThrow('fora do formato')
  })

  it('o tipo segue o JSON real: valor e limite são números, horários em ISO', () => {
    expect(typeof alarme.valor).toBe('number')
    expect(typeof alarme.limite).toBe('number')
    expect(Number.isNaN(Date.parse(alarme.lido_em))).toBe(false)
    expect(Object.keys(resumo.abertos).sort()).toEqual(['ALERTA', 'ATENCAO', 'CRITICO'])
  })
})

describe('classificarErroAlarmes', () => {
  it.each([
    ['sem resposta', new AxiosError('Network Error', 'ERR_NETWORK'), 'sem-conexao'],
    ['403', respostaComStatus(403), 'sem-permissao'],
    ['404', respostaComStatus(404), 'nao-encontrado'],
    ['500', respostaComStatus(500), 'servidor'],
    ['erro qualquer', new Error('x'), 'servidor'],
  ] as const)('%s → %s', (_caso, erro, tipo) => {
    expect(classificarErroAlarmes(erro)).toBe(tipo)
  })

  it('cada tipo tem mensagem própria', () => {
    expect(new Set(Object.values(MENSAGENS_ERRO_ALARMES)).size).toBe(4)
  })
})
