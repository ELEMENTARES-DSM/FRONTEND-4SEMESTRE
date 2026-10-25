import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import api from '../../api/instance'
import { AuthContext } from '../../auth/AuthContext'
import exemplos from '../../services/alarms/exemplos-openapi.json'
import type { ResumoAlarmes } from '../../types/alarms'
import { IndicadorAlarmes, LINK_ALARMES_ABERTOS } from './IndicadorAlarmes'

type Papel = 'ADMINISTRADOR' | 'GESTOR_PUBLICO' | 'PESQUISADOR'

function renderIndicador(papel: Papel) {
  return render(
    <AuthContext.Provider
      value={{
        token: 'token-teste',
        usuario: { id: papel, nome: papel, papel, municipio: 'São José dos Campos' },
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      <MemoryRouter>
        <IndicadorAlarmes />
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Indicador de alarmes abertos (US-24)', () => {
  it('cenário 3: com 2 CRITICO e 1 ALERTA abertos mostra Crítico 2 e Alerta 1, com cor e texto', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: exemplos.resumo })

    renderIndicador('GESTOR_PUBLICO')

    const link = await screen.findByRole('link', { name: 'Alarmes abertos: 3' })
    expect(link).toHaveTextContent('Crítico 2')
    expect(link).toHaveTextContent('Alerta 1')
    expect(link).not.toHaveTextContent('Atenção')
    expect(screen.getByText('Crítico 2').className).toContain('text-error')
  })

  it('leva para a lista filtrada pelos abertos, que bate com o indicador', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: exemplos.resumo })

    renderIndicador('ADMINISTRADOR')

    expect(await screen.findByRole('link')).toHaveAttribute('href', LINK_ALARMES_ABERTOS)
    expect(LINK_ALARMES_ABERTOS).toBe('/platform/alarmes?situacao=aberto&periodo=todos')
  })

  it('sem alarme aberto mostra "Nenhum"', async () => {
    const vazio: ResumoAlarmes = { abertos: { ATENCAO: 0, ALERTA: 0, CRITICO: 0 }, total: 0 }
    vi.spyOn(api, 'get').mockResolvedValue({ data: vazio })

    renderIndicador('GESTOR_PUBLICO')

    expect(await screen.findByText('Nenhum')).toBeInTheDocument()
  })

  it('atualiza sozinho a cada 30 segundos', async () => {
    const vazio: ResumoAlarmes = { abertos: { ATENCAO: 0, ALERTA: 0, CRITICO: 0 }, total: 0 }
    const get = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: vazio }).mockResolvedValue({ data: exemplos.resumo })
    renderIndicador('GESTOR_PUBLICO')
    await screen.findByText('Nenhum')

    await act(() => vi.advanceTimersByTimeAsync(30_000))

    expect(await screen.findByText('Crítico 2')).toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('cenário 5: para o pesquisador não aparece nem consulta a rota', async () => {
    const get = vi.spyOn(api, 'get')

    const { container } = renderIndicador('PESQUISADOR')
    await act(() => vi.advanceTimersByTimeAsync(30_000))

    expect(container).toBeEmptyDOMElement()
    expect(get).not.toHaveBeenCalled()
  })

  it('falha na consulta não quebra o cabeçalho', async () => {
    vi.spyOn(api, 'get').mockRejectedValue(new Error('rede'))

    renderIndicador('GESTOR_PUBLICO')

    expect(await screen.findByText('Alarmes indisponíveis')).toBeInTheDocument()
  })
})
