// @vitest-environment happy-dom
import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Cadastro } from './Cadastro'
import * as cadastroService from '../../services/cadastroService'
import { CadastroServiceError } from '../../services/cadastroService'

const authMock = vi.hoisted(() => ({
  token: null as string | null,
}))

vi.mock('../../auth/useAuth', () => ({
  useAuth: () => authMock,
}))

vi.mock('../../auth/session', () => ({
  devAuthBypass: false,
}))

vi.mock('../../services/cadastroService', async (importOriginal) => {
  const actual = await importOriginal<typeof cadastroService>()
  return {
    ...actual,
    cadastrarMunicipe: vi.fn(),
  }
})

function renderCadastro() {
  return render(
    <MemoryRouter initialEntries={['/cadastro']}>
      <Routes>
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/login" element={<p>Tela de Login</p>} />
        <Route path="/platform" element={<p>Página protegida</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function fillForm(customValues: Partial<{
  nome: string
  email: string
  senha: string
  municipio: string
  aceite: boolean
}> = {}) {
  const values = {
    nome: 'Maria da Silva',
    email: 'maria.silva@exemplo.com',
    senha: 'SenhaForte@2026',
    municipio: 'São José dos Campos',
    aceite: true,
    ...customValues,
  }

  fireEvent.change(screen.getByRole('textbox', { name: /Nome completo \*/i }), {
    target: { value: values.nome },
  })
  fireEvent.change(screen.getByRole('textbox', { name: /E-mail \*/i }), {
    target: { value: values.email },
  })
  fireEvent.change(screen.getByLabelText(/Senha \*/i), {
    target: { value: values.senha },
  })
  fireEvent.change(screen.getByRole('textbox', { name: /Município \(opcional\)/i }), {
    target: { value: values.municipio },
  })

  const checkbox = screen.getByRole('checkbox')
  if (checkbox && (checkbox as HTMLInputElement).checked !== values.aceite) {
    fireEvent.click(checkbox)
  }

  fireEvent.click(screen.getByRole('button', { name: /Criar minha conta/i }))
}

describe('Tela de Cadastro do Munícipe (Cadastro.tsx)', () => {
  afterEach(cleanup)

  beforeEach(() => {
    authMock.token = null
    vi.mocked(cadastroService.cadastrarMunicipe).mockReset()
  })

  it('redireciona para /platform caso o usuário já esteja autenticado', () => {
    authMock.token = 'token-valido'
    renderCadastro()

    expect(screen.getByText('Página protegida')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Criar minha conta/i })).not.toBeInTheDocument()
  })

  it('exibe as regras de complexidade da senha e atualiza o feedback visual', () => {
    renderCadastro()

    expect(screen.getByText(/No mínimo 8 caracteres/i)).toBeInTheDocument()
    expect(screen.getByText(/Pelo menos uma letra maiúscula/i)).toBeInTheDocument()
    expect(screen.getByText(/Pelo menos uma letra minúscula/i)).toBeInTheDocument()
    expect(screen.getByText(/Pelo menos um número/i)).toBeInTheDocument()
    expect(screen.getByText(/Pelo menos um caractere especial/i)).toBeInTheDocument()

    const senhaInput = screen.getByLabelText(/Senha \*/i)
    fireEvent.change(senhaInput, { target: { value: 'A' } })
    expect(screen.getByText(/Pelo menos uma letra maiúscula/i).parentElement).toHaveClass('text-success')
    expect(screen.getByText(/No mínimo 8 caracteres/i).parentElement).toHaveClass('text-muted')
  })

  it('possui link navegável "Já tenho conta, entrar" apontando para a tela de login', () => {
    renderCadastro()

    const linkLogin = screen.getByRole('link', { name: /Já tenho conta, entrar/i })
    expect(linkLogin).toBeInTheDocument()
    expect(linkLogin).toHaveAttribute('href', '/login')
  })

  it('exibe texto provisório de privacidade sem texto jurídico inventado', () => {
    renderCadastro()

    expect(
      screen.getByText(/\[Texto do aviso de privacidade, pendente de aprovação da Prefeitura\]/i),
    ).toBeInTheDocument()
  })

  it('bloqueia submissão no cliente se faltar aceite de privacidade ou campos obrigatórios', async () => {
    renderCadastro()

    fillForm({ aceite: false })

    expect(
      await screen.findByText('O aceite do aviso de privacidade é obrigatório'),
    ).toBeInTheDocument()
    expect(cadastroService.cadastrarMunicipe).not.toHaveBeenCalled()
  })

  it('Cenário 1 (Sucesso): submete dados válidos, exibe estado de sucesso e permite entrar', async () => {
    vi.mocked(cadastroService.cadastrarMunicipe).mockResolvedValueOnce({
      id: 'usr-1',
      nome: 'Maria da Silva',
      email: 'maria.silva@exemplo.com',
      papel_id: 'papel-municipe',
      municipio: 'São José dos Campos',
      esta_ativo: true,
      aceite_privacidade_em: '2026-11-19T10:00:00.000Z',
      criado_em: '2026-11-19T10:00:00.000Z',
      atualizado_em: '2026-11-19T10:00:00.000Z',
    })

    renderCadastro()
    fillForm()

    await waitFor(() => {
      expect(cadastroService.cadastrarMunicipe).toHaveBeenCalledWith({
        nome: 'Maria da Silva',
        email: 'maria.silva@exemplo.com',
        senha: 'SenhaForte@2026',
        municipio: 'São José dos Campos',
        aceite_privacidade: true,
      })
    })

    expect(await screen.findByText('Cadastro realizado com sucesso!')).toBeInTheDocument()
    const entrarBtn = screen.getByRole('button', { name: /Entrar na plataforma/i })
    expect(entrarBtn).toBeInTheDocument()

    fireEvent.click(entrarBtn)
    expect(await screen.findByText('Tela de Login')).toBeInTheDocument()
  })

  it('Erro 409 (Conflito): exibe mensagem de erro direcionada ao campo de e-mail', async () => {
    vi.mocked(cadastroService.cadastrarMunicipe).mockRejectedValueOnce(
      new CadastroServiceError('E-mail já cadastrado', 409),
    )

    renderCadastro()
    fillForm()

    expect(
      await screen.findByText('Este e-mail já está cadastrado na plataforma.'),
    ).toBeInTheDocument()
  })

  it('Erro 400 (Bad Request): exibe erros específicos de validação por campo retornados pela API', async () => {
    vi.mocked(cadastroService.cadastrarMunicipe).mockRejectedValueOnce(
      new CadastroServiceError('Dados inválidos', 400, {
        senha: ['Senha deve conter pelo menos um caractere especial'],
      }),
    )

    renderCadastro()
    fillForm()

    expect(
      await screen.findByText('Senha deve conter pelo menos um caractere especial'),
    ).toBeInTheDocument()
  })

  it('Erro 429 (Rate Limit): exibe aviso de muitas tentativas para tentar mais tarde', async () => {
    vi.mocked(cadastroService.cadastrarMunicipe).mockRejectedValueOnce(
      new CadastroServiceError(
        'Limite de tentativas de cadastro excedido para este IP. Tente novamente mais tarde.',
        429,
      ),
    )

    renderCadastro()
    fillForm()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(/Tente novamente mais tarde/i)
  })
})
