// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Usuarios } from './Usuarios'

// O serviço é simulado: nenhum teste chama o backend.
const api = vi.hoisted(() => ({
  listarUsuarios: vi.fn(),
  listarPapeis: vi.fn(),
  buscarUsuario: vi.fn(),
  criarUsuario: vi.fn(),
  atualizarUsuario: vi.fn(),
  alterarStatusUsuario: vi.fn(),
  excluirUsuario: vi.fn(),
}))

vi.mock('../../services/usuariosService', () => api)

const papeis = [
  { id: 'papel-admin', nome: 'ADMINISTRADOR', descricao: 'Gestão global.' },
  { id: 'papel-gestor', nome: 'GESTOR_PUBLICO', descricao: 'Município.' },
]

const ana = {
  id: 'u-1', nome: 'Ana Real', email: 'ana@real.com', papel_id: 'papel-admin',
  papel_nome: 'ADMINISTRADOR', municipio: null, esta_ativo: true,
}

const semBackend = { isAxiosError: true, response: undefined }

function renderPage() {
  return render(<MemoryRouter><Usuarios /></MemoryRouter>)
}

describe('Gestão de Usuários', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllEnvs()
  })

  beforeEach(() => {
    // A configuração local do desenvolvedor não deve mudar o cenário dos testes.
    // Os casos que verificam os mocks ativam a variável explicitamente.
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    Object.values(api).forEach((fn) => fn.mockReset())
    api.listarUsuarios.mockResolvedValue([ana])
    api.listarPapeis.mockResolvedValue(papeis)
  })

  it('lista os usuários da API e usa os papéis no select', async () => {
    renderPage()

    expect(await screen.findAllByText('Ana Real')).toHaveLength(2)
    expect(screen.queryByText(/dados de exemplo/)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Novo usuário/ }))
    const papel = screen.getByRole('combobox', { name: 'Papel' })
    expect(within(papel).getByRole('option', { name: 'GESTOR_PUBLICO' })).toHaveValue('papel-gestor')
  })

  it('usa os mocks quando o backend está indisponível', async () => {
    api.listarUsuarios.mockRejectedValue(semBackend)
    renderPage()

    expect(await screen.findByText(/dados de exemplo/)).toBeInTheDocument()
    expect(screen.getAllByText('Ana Beatriz Ferreira')).toHaveLength(2)

    // Operações não chamam a API no modo mock.
    fireEvent.click(within(screen.getByRole('table')).getByRole('switch', { name: 'Desativar Ana Beatriz Ferreira' }))
    expect(await within(screen.getByRole('table')).findByRole('switch', { name: 'Ativar Ana Beatriz Ferreira' })).toBeInTheDocument()
    expect(api.alterarStatusUsuario).not.toHaveBeenCalled()
  })

  it('carrega os usuários fictícios quando VITE_USE_MOCKS está ativo', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true')
    renderPage()

    expect(await screen.findAllByText('Ana Beatriz Ferreira')).toHaveLength(2)
    expect(screen.getByText('30', { selector: 'strong' })).toBeInTheDocument()
    expect(screen.queryByText(/Acesso:/)).not.toBeInTheDocument()
    expect(api.listarUsuarios).not.toHaveBeenCalled()
    expect(api.listarPapeis).not.toHaveBeenCalled()
  })

  it('combina perfil, município e status e limpa os filtros', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true')
    renderPage()
    await screen.findAllByText('Ana Beatriz Ferreira')

    const painel = screen.getByRole('region', { name: 'Filtros de usuários' })
    fireEvent.change(within(painel).getByRole('combobox', { name: 'Perfil' }), { target: { value: 'GESTOR_PUBLICO' } })
    fireEvent.change(within(painel).getByRole('combobox', { name: 'Município' }), { target: { value: 'São Paulo' } })
    fireEvent.change(within(painel).getByRole('combobox', { name: 'Status' }), { target: { value: 'ativo' } })

    expect(screen.getAllByText('Carlos Eduardo Mendes')).toHaveLength(2)
    expect(screen.getAllByText('Leandro Carvalho Melo')).toHaveLength(2)
    expect(screen.queryByText('Ana Beatriz Ferreira')).not.toBeInTheDocument()
    fireEvent.click(within(painel).getByRole('button', { name: 'Limpar filtros' }))
    expect(screen.getAllByText('Ana Beatriz Ferreira')).toHaveLength(2)
  })

  it('abre a edição clicando na linha ou no cartão, sem usar botão Editar na tabela', async () => {
    api.buscarUsuario.mockResolvedValue(ana)
    renderPage()
    await screen.findAllByText('Ana Real')

    const linha = within(screen.getByRole('table')).getByText('Ana Real').closest('tr')!
    expect(within(linha).queryByRole('button', { name: 'Editar Ana Real' })).not.toBeInTheDocument()
    fireEvent.click(linha)
    expect(await screen.findByRole('dialog', { name: 'Editar usuário' })).toBeInTheDocument()
    expect(api.buscarUsuario).toHaveBeenCalledWith('u-1')

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Fechar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Editar Ana Real' }))
    expect(await screen.findByRole('dialog', { name: 'Editar usuário' })).toBeInTheDocument()
  })

  it('mantém o clique no toggle independente da abertura da edição', async () => {
    api.alterarStatusUsuario.mockResolvedValue(undefined)
    renderPage()
    fireEvent.click(await within(screen.getByRole('table')).findByRole('switch', { name: 'Desativar Ana Real' }))
    expect(api.buscarUsuario).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mostra erro amigável quando a API recusa a listagem', async () => {
    api.listarUsuarios.mockRejectedValue({ isAxiosError: true, response: { status: 403, data: { message: 'Acesso negado' } } })
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Acesso negado')
    expect(screen.getAllByText('Não foi possível carregar os usuários.')).toHaveLength(2)
  })

  it('desativa o usuário enviando esta_ativo false', async () => {
    api.alterarStatusUsuario.mockResolvedValue(undefined)
    renderPage()

    fireEvent.click(await within(screen.getByRole('table')).findByRole('switch', { name: 'Desativar Ana Real' }))

    expect(await within(screen.getByRole('table')).findByRole('switch', { name: 'Ativar Ana Real' })).toBeInTheDocument()
    expect(api.alterarStatusUsuario).toHaveBeenCalledWith('u-1', false)
  })

  it('mantém o status anterior quando a alteração falha', async () => {
    api.alterarStatusUsuario.mockRejectedValue({ isAxiosError: true, response: { status: 404, data: { message: 'Usuário não encontrado' } } })
    renderPage()

    fireEvent.click(await within(screen.getByRole('table')).findByRole('switch', { name: 'Desativar Ana Real' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário não encontrado')
    expect(within(screen.getByRole('table')).getByRole('switch', { name: 'Desativar Ana Real' })).toBeChecked()
  })

  it('exclui o usuário após confirmação', async () => {
    api.excluirUsuario.mockResolvedValue(undefined)
    renderPage()

    fireEvent.click(await within(screen.getByRole('table')).findByRole('button', { name: 'Excluir Ana Real' }))
    const dialogo = screen.getByRole('dialog', { name: 'Excluir usuário?' })
    expect(within(dialogo).getByText('Ana Real')).toBeInTheDocument()
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar exclusão' }))

    expect(await screen.findAllByText('Nenhum usuário encontrado.')).toHaveLength(2)
    expect(api.excluirUsuario).toHaveBeenCalledWith('u-1')
  })
})
