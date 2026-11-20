import api from '../api/instance'
import type { CadastroMunicipeInput } from '../utils/cadastroMunicipeValidator'

export interface UsuarioPublicoResponse {
  id: string
  nome: string
  email: string
  papel_id: string
  municipio: string | null
  esta_ativo: boolean
  aceite_privacidade_em: string | null
  criado_em: string
  atualizado_em: string
}

export interface CadastroErrorResponse {
  message: string
  errors?: Record<string, string[]>
}

export class CadastroServiceError extends Error {
  status: number
  fieldErrors?: Record<string, string[]>

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'CadastroServiceError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function isErrorWithResponse(
  error: unknown,
): error is { response: { status: number; data?: CadastroErrorResponse } } {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return false
  }
  const { response } = error as { response?: unknown }
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    typeof (response as { status?: unknown }).status === 'number'
  )
}

/**
 * Realiza o cadastro público do munícipe via POST /usuarios/cadastro
 * (roteado para gestao-usuarios no gateway Nginx ou em mock / API direta)
 */
export async function cadastrarMunicipe(
  dados: CadastroMunicipeInput,
): Promise<UsuarioPublicoResponse> {
  try {
    const payload = {
      nome: dados.nome.trim(),
      email: dados.email.trim().toLowerCase(),
      senha: dados.senha,
      municipio: dados.municipio?.trim() ? dados.municipio.trim() : undefined,
      aceite_privacidade: dados.aceite_privacidade,
    }

    const response = await api.post<UsuarioPublicoResponse>('/usuarios/cadastro', payload)
    return response.data
  } catch (error: unknown) {
    if (isErrorWithResponse(error)) {
      const status = error.response.status
      const data: CadastroErrorResponse = error.response.data ?? { message: '' }

      if (status === 409) {
        throw new CadastroServiceError(
          data.message || 'Já existe um usuário com o e-mail informado.',
          409,
        )
      }

      if (status === 400) {
        throw new CadastroServiceError(
          data.message || 'Dados inválidos.',
          400,
          data.errors,
        )
      }

      if (status === 429) {
        throw new CadastroServiceError(
          'Muitas tentativas de cadastro. Por favor, tente novamente mais tarde.',
          429,
        )
      }

      throw new CadastroServiceError(
        data.message || 'Erro ao realizar o cadastro. Tente novamente mais tarde.',
        status,
        data.errors,
      )
    }

    throw new CadastroServiceError(
      'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
      0,
    )
  }
}
