import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthProvider'
import api from '../../api/instance'
import { Platform } from './Platform'

const STATUS = {
  resumo: { total: 2, ativas: 1, com_falha: 1, inativas: 0 },
  estacoes: [
    { id: 'e1', codigo: 'SJC-001', nome: 'Estação Centro', status_operacional: 'Ativa', ultimo_ping: '2026-10-24T13:00:00.000Z' },
    { id: 'e2', codigo: 'SJC-002', nome: 'Estação Norte', status_operacional: 'Com Falha', ultimo_ping: null },
  ],
}

function renderPlatform(papel: string) {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }))
  localStorage.setItem('token', `header.${payload}.signature`)
  localStorage.setItem('usuario', JSON.stringify({
    id: 'usuario-teste', nome: 'Maria Silva', papel, municipio: 'São José dos Campos',
  }))
  return render(
    <MemoryRouter initialEntries={['/platform']}>
      <AuthProvider>
        <Platform />
      </AuthProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('Visão Geral por perfil (TASK 24.05)', () => {
  it('o pesquisador vê a Visão Geral sem erro e sem consultar as estações', async () => {
    const get = vi.spyOn(api, 'get').mockRejectedValue({ isAxiosError: true, response: { status: 403 } })

    renderPlatform('PESQUISADOR')

    expect(screen.getByRole('heading', { name: 'Plataforma' })).toBeInTheDocument()
    expect(screen.getByText(/são para gestores públicos e administradores/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
    expect(get).not.toHaveBeenCalled()
  })

  it.each(['GESTOR_PUBLICO', 'ADMINISTRADOR'])('%s continua vendo os indicadores e a tabela de estações', async (papel) => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: STATUS })

    renderPlatform(papel)

    expect(await screen.findByText('Estação Centro')).toBeInTheDocument()
    expect(screen.getByText('Estação Norte')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/estacoes/status')
    expect(screen.queryByText(/são para gestores públicos e administradores/)).not.toBeInTheDocument()
  })

  it('para quem tem acesso, a falha de conexão mostra a mensagem e o botão de tentar de novo', async () => {
    const get = vi.spyOn(api, 'get')
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({ data: STATUS })

    renderPlatform('GESTOR_PUBLICO')

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as estações')
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Estação Centro')).toBeInTheDocument()
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
  })
})
