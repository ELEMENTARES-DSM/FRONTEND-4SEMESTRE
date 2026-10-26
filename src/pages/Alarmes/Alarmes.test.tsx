import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import api from '../../api/instance'
import { AuthContext } from '../../auth/AuthContext'
import exemplos from '../../services/alarms/exemplos-openapi.json'
import type { Alarme } from '../../types/alarms'
import { Alarmes } from './Alarmes'

const exemplo = exemplos.alarme as Alarme
const outroMunicipio = '9f9f9f9f-0000-4000-8000-000000000000'

type RespostaGet = (url: string, params?: Record<string, string>) => unknown

function renderAlarmes(caminho = '/platform/alarmes') {
  return render(
    <AuthContext.Provider
      value={{
        token: 'token-teste',
        usuario: { id: 'gestor', nome: 'Gestora', papel: 'GESTOR_PUBLICO', municipio: 'São José dos Campos' },
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[caminho]}>
        <Routes>
          <Route path="/platform/alarmes" element={<Alarmes />} />
          <Route path="/platform/alarmes/:alarmeId" element={<Alarmes />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

function responder(fn: RespostaGet) {
  return vi.spyOn(api, 'get').mockImplementation(async (url: string, config?: AxiosRequestConfig) => {
    if (url === '/estacoes/status') return { data: { resumo: {}, estacoes: [] } }
    const resultado = fn(url, config?.params as Record<string, string> | undefined)
    if (resultado instanceof Error) throw resultado
    return { data: resultado }
  })
}

const comStatus = (status: number) =>
  new AxiosError('falha', 'ERR_BAD_RESPONSE', undefined, undefined, { status, data: {} } as AxiosResponse)

const chamadasDaLista = (get: ReturnType<typeof responder>) =>
  get.mock.calls.filter(([url]) => url === '/alertas/alarmes').map(([, config]) => (config as { params: Record<string, string> }).params)

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date('2026-10-24T13:30:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Tela de alarmes (US-24)', () => {
  it('cenário 1: mostra data e hora, estação, sensor, regra, valor × limite, severidade e situação', async () => {
    responder(() => [exemplo])

    renderAlarmes()

    const linha = (await screen.findByText('52,3 µg/m³ ≥ 50 µg/m³')).closest('tr') as HTMLElement
    const celulas = within(linha)
    expect(celulas.getByText('24/10/2026, 10:00:00')).toBeInTheDocument()
    expect(celulas.getByText('SJC-001 · Estação Centro')).toBeInTheDocument()
    expect(celulas.getByText('PM25-01 · PM2.5')).toBeInTheDocument()
    expect(celulas.getByText('PM2.5 crítico')).toBeInTheDocument()
    expect(celulas.getByText('Crítico')).toBeInTheDocument()
    expect(celulas.getByText('Aberto')).toBeInTheDocument()
  })

  it('cenário 2: severidade CRITICO e período de hoje vão juntos para a API', async () => {
    const get = responder(() => [])
    renderAlarmes('/platform/alarmes?periodo=7d')
    await screen.findByText('Nenhum alarme no período')

    fireEvent.change(screen.getByLabelText('Período'), { target: { value: 'hoje' } })
    fireEvent.change(screen.getByLabelText('Severidade'), { target: { value: 'CRITICO' } })

    const inicioDoDia = new Date('2026-10-24T13:30:00.000Z')
    inicioDoDia.setHours(0, 0, 0, 0)
    const fimDoDia = new Date('2026-10-24T13:30:00.000Z')
    fimDoDia.setHours(23, 59, 59, 999)
    await waitFor(() =>
      expect(chamadasDaLista(get).at(-1)).toEqual({
        severidade: 'CRITICO',
        de: inicioDoDia.toISOString(),
        ate: fimDoDia.toISOString(),
      }),
    )
  })

  it('situação e estação da URL também viram filtros (atalho do indicador)', async () => {
    const get = responder(() => [])

    renderAlarmes(`/platform/alarmes?situacao=aberto&periodo=todos&estacao=${exemplo.estacao_id}`)

    await screen.findByText('Nenhum alarme no período')
    expect(chamadasDaLista(get)[0]).toEqual({ situacao: 'aberto', estacao_id: exemplo.estacao_id })
  })

  it('cenário 4: alarme de outro município buscado por id mostra "não encontrado"', async () => {
    responder((url) => (url === `/alertas/alarmes/${outroMunicipio}` ? comStatus(404) : []))

    renderAlarmes(`/platform/alarmes/${outroMunicipio}`)

    const painel = await screen.findByRole('complementary', { name: 'Detalhe do alarme' })
    expect(await within(painel).findByRole('alert')).toHaveTextContent('Alarme não encontrado.')
  })

  it('abre o detalhe no painel lateral ao clicar no alarme', async () => {
    responder((url) => (url === `/alertas/alarmes/${exemplo.id}` ? exemplo : [exemplo]))
    renderAlarmes()

    fireEvent.click(await screen.findByText('52,3 µg/m³ ≥ 50 µg/m³'))

    const painel = await screen.findByRole('complementary', { name: 'Detalhe do alarme' })
    expect(await within(painel).findByText('São José dos Campos')).toBeInTheDocument()
  })

  it('cenário 6: lista vazia mostra "Nenhum alarme no período", sem mensagem de erro', async () => {
    responder(() => [])

    renderAlarmes()

    expect(await screen.findByText('Nenhum alarme no período')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    ['sem conexão', new AxiosError('Network Error', 'ERR_NETWORK'), 'Sem conexão com o servidor'],
    ['sem permissão', comStatus(403), 'Seu perfil não tem permissão'],
    ['erro do servidor', comStatus(500), 'O servidor não conseguiu responder'],
  ])('erro %s tem mensagem própria e permite tentar de novo', async (_caso, erro, mensagem) => {
    let falhar = true
    responder(() => (falhar ? erro : []))
    renderAlarmes()

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)

    falhar = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText('Nenhum alarme no período')).toBeInTheDocument()
  })

  it('cenário 7: um alarme CRITICO novo aparece na atualização de 30 segundos', async () => {
    let lista: Alarme[] = []
    responder(() => lista)
    renderAlarmes()
    await screen.findByText('Nenhum alarme no período')

    lista = [exemplo]
    await act(() => vi.advanceTimersByTimeAsync(30_000))

    expect(await screen.findByText('52,3 µg/m³ ≥ 50 µg/m³')).toBeInTheDocument()
  })

  it('falha na atualização automática mantém a lista na tela e avisa', async () => {
    let falhar = false
    responder(() => (falhar ? new AxiosError('Network Error', 'ERR_NETWORK') : [exemplo]))
    renderAlarmes()
    await screen.findByText('52,3 µg/m³ ≥ 50 µg/m³')

    falhar = true
    await act(() => vi.advanceTimersByTimeAsync(30_000))

    expect(await screen.findByRole('status')).toHaveTextContent('Não foi possível atualizar agora')
    expect(screen.getByText('52,3 µg/m³ ≥ 50 µg/m³')).toBeInTheDocument()
  })
})
