import { z } from 'zod'

export const cadastroMunicipeSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(120, 'Nome deve ter no máximo 120 caracteres'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('E-mail inválido')
    .max(150, 'E-mail deve ter no máximo 150 caracteres'),
  senha: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(72, 'Senha deve ter no máximo 72 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um dígito numérico')
    .regex(/[^a-zA-Z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
  municipio: z
    .string()
    .trim()
    .max(100, 'Município deve ter no máximo 100 caracteres')
    .optional(),
  aceite_privacidade: z.literal(true, {
    message: 'O aceite do aviso de privacidade é obrigatório',
  }),
})

export type CadastroMunicipeInput = {
  nome: string
  email: string
  senha: string
  municipio?: string
  aceite_privacidade: boolean
}

export interface PasswordRuleCheck {
  label: string
  isValid: boolean
}

export function evaluatePasswordRules(password: string): PasswordRuleCheck[] {
  return [
    {
      label: 'No mínimo 8 caracteres (máximo 72)',
      isValid: password.length >= 8 && password.length <= 72,
    },
    {
      label: 'Pelo menos uma letra maiúscula',
      isValid: /[A-Z]/.test(password),
    },
    {
      label: 'Pelo menos uma letra minúscula',
      isValid: /[a-z]/.test(password),
    },
    {
      label: 'Pelo menos um número',
      isValid: /[0-9]/.test(password),
    },
    {
      label: 'Pelo menos um caractere especial (símbolo)',
      isValid: /[^a-zA-Z0-9]/.test(password),
    },
  ]
}

export function validarCadastroMunicipe(dados: CadastroMunicipeInput): {
  success: boolean
  errors: Record<string, string>
} {
  const result = cadastroMunicipeSchema.safeParse(dados)
  if (result.success) {
    return { success: true, errors: {} }
  }

  const errors: Record<string, string> = {}
  const flattened = result.error.flatten().fieldErrors
  for (const [key, messages] of Object.entries(flattened)) {
    if (messages && messages.length > 0) {
      errors[key] = messages[0]
    }
  }

  return { success: false, errors }
}
