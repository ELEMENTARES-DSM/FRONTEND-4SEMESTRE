import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cadastrarMunicipe, CadastroServiceError } from './cadastroService'

const http = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock('../api/instance', () => ({ default: http }))

describe('cadastroService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  const inputValido = {
    nome: '  Ana da Silva  ',
    email: '  ANA.SILVA@EXEMPLO.COM  ',
    senha: 'SenhaForte@2026',
    municipio: '  São José dos Campos  ',
    aceite_privacidade: true,
  }

  const mockUsuarioRetorno = {
    id: '11111111-2222-3333-4444-555555555555',
    nome: 'Ana da Silva',
    email: 'ana.silva@exemplo.com',
    papel_id: '99999999-8888-7777-6666-555555555555',
    municipio: 'São José dos Campos',
    esta_ativo: true,
    aceite_privacidade_em: '2026-11-17T12:00:00.000Z',
    criado_em: '2026-11-17T12:00:00.000Z',
    atualizado_em: '2026-11-17T12:00:00.000Z',
  }

  it('normaliza os dados e realiza o POST /usuarios/cadastro com sucesso', async () => {
    http.post.mockResolvedValueOnce({ data: mockUsuarioRetorno })

    const resultado = await cadastrarMunicipe(inputValido)

    expect(resultado).toEqual(mockUsuarioRetorno)
    expect(http.post).toHaveBeenCalledWith('/usuarios/cadastro', {
      nome: 'Ana da Silva',
      email: 'ana.silva@exemplo.com',
      senha: 'SenhaForte@2026',
      municipio: 'São José dos Campos',
      aceite_privacidade: true,
    })
  })

  it('trata município vazio como undefined no payload enviado', async () => {
    http.post.mockResolvedValueOnce({ data: mockUsuarioRetorno })

    await cadastrarMunicipe({
      ...inputValido,
      municipio: '   ',
    })

    expect(http.post).toHaveBeenCalledWith(
      '/usuarios/cadastro',
      expect.objectContaining({
        municipio: undefined,
      }),
    )
  })

  it('lança CadastroServiceError 409 quando o e-mail já existe', async () => {
    http.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: 'E-mail já cadastrado' },
      },
    })

    await expect(cadastrarMunicipe(inputValido)).rejects.toMatchObject({
      name: 'CadastroServiceError',
      status: 409,
      message: 'E-mail já cadastrado',
    })
  })

  it('lança CadastroServiceError 400 com mapa de erros de campos', async () => {
    const fieldErrors = {
      senha: ['Senha deve conter pelo menos um caractere especial'],
    }
    http.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: {
          message: 'Dados inválidos',
          errors: fieldErrors,
        },
      },
    })

    await expect(cadastrarMunicipe(inputValido)).rejects.toMatchObject({
      name: 'CadastroServiceError',
      status: 400,
      fieldErrors,
    })
  })

  it('lança CadastroServiceError 429 com mensagem para tentar mais tarde', async () => {
    http.post.mockRejectedValueOnce({
      response: {
        status: 429,
        data: {
          message: 'Limite de tentativas de cadastro excedido para este IP. Tente novamente mais tarde.',
        },
      },
    })

    const promise = cadastrarMunicipe(inputValido)
    await expect(promise).rejects.toBeInstanceOf(CadastroServiceError)
    await expect(promise).rejects.toMatchObject({
      status: 429,
      message: expect.stringContaining('mais tarde'),
    })
  })

  it('lança erro genérico quando o backend está inacessível (sem response)', async () => {
    http.post.mockRejectedValueOnce(new Error('Network Error'))

    await expect(cadastrarMunicipe(inputValido)).rejects.toMatchObject({
      name: 'CadastroServiceError',
      status: 0,
      message: expect.stringContaining('Não foi possível conectar ao servidor'),
    })
  })
})
