import { describe, expect, it } from 'vitest'
import {
  evaluatePasswordRules,
  validarCadastroMunicipe,
} from './cadastroMunicipeValidator'

describe('cadastroMunicipeValidator', () => {
  const dadosValidos = {
    nome: 'Maria da Silva',
    email: 'maria.silva@exemplo.com',
    senha: 'SenhaForte@2026',
    municipio: 'São José dos Campos',
    aceite_privacidade: true,
  }

  describe('validarCadastroMunicipe', () => {
    it('valida com sucesso payload completo', () => {
      const res = validarCadastroMunicipe(dadosValidos)
      expect(res.success).toBe(true)
      expect(res.errors).toEqual({})
    })

    it('valida com sucesso sem município (opcional)', () => {
      const res = validarCadastroMunicipe({
        ...dadosValidos,
        municipio: undefined,
      })
      expect(res.success).toBe(true)
      expect(res.errors).toEqual({})
    })

    it('rejeita nome com menos de 2 caracteres', () => {
      const res = validarCadastroMunicipe({
        ...dadosValidos,
        nome: 'A',
      })
      expect(res.success).toBe(false)
      expect(res.errors.nome).toBe('Nome deve ter no mínimo 2 caracteres')
    })

    it('rejeita email inválido', () => {
      const res = validarCadastroMunicipe({
        ...dadosValidos,
        email: 'email-invalido',
      })
      expect(res.success).toBe(false)
      expect(res.errors.email).toBe('E-mail inválido')
    })

    it('rejeita aceite_privacidade false ou indefinido', () => {
      const res = validarCadastroMunicipe({
        ...dadosValidos,
        aceite_privacidade: false,
      })
      expect(res.success).toBe(false)
      expect(res.errors.aceite_privacidade).toBe('O aceite do aviso de privacidade é obrigatório')
    })

    it('rejeita senha sem maiúscula', () => {
      const res = validarCadastroMunicipe({
        ...dadosValidos,
        senha: 'senhaforte@2026',
      })
      expect(res.success).toBe(false)
      expect(res.errors.senha).toBe('Senha deve conter pelo menos uma letra maiúscula')
    })

    it('rejeita senha sem minúscula', () => {
      const res = validarCadastroMunicipe({
        ...dadosValidos,
        senha: 'SENHAFORTE@2026',
      })
      expect(res.success).toBe(false)
      expect(res.errors.senha).toBe('Senha deve conter pelo menos uma letra minúscula')
    })

    it('rejeita senha sem número', () => {
      const res = validarCadastroMunicipe({
        ...dadosValidos,
        senha: 'SenhaForteSemNumero@',
      })
      expect(res.success).toBe(false)
      expect(res.errors.senha).toBe('Senha deve conter pelo menos um dígito numérico')
    })

    it('rejeita senha sem símbolo especial', () => {
      const res = validarCadastroMunicipe({
        ...dadosValidos,
        senha: 'SenhaForte2026',
      })
      expect(res.success).toBe(false)
      expect(res.errors.senha).toBe('Senha deve conter pelo menos um caractere especial')
    })

    it('rejeita senha com menos de 8 caracteres', () => {
      const res = validarCadastroMunicipe({
        ...dadosValidos,
        senha: 'Ab1!xyz',
      })
      expect(res.success).toBe(false)
      expect(res.errors.senha).toBe('Senha deve ter no mínimo 8 caracteres')
    })
  })

  describe('evaluatePasswordRules', () => {
    it('avalia todas as regras como verdadeiras para senha forte', () => {
      const rules = evaluatePasswordRules('SenhaForte@2026')
      expect(rules).toHaveLength(5)
      expect(rules.every((r) => r.isValid)).toBe(true)
    })

    it('identifica falha de comprimento e de regras específicas', () => {
      const rules = evaluatePasswordRules('abc')
      expect(rules.find((r) => r.label.includes('8 caracteres'))?.isValid).toBe(false)
      expect(rules.find((r) => r.label.includes('maiúscula'))?.isValid).toBe(false)
      expect(rules.find((r) => r.label.includes('minúscula'))?.isValid).toBe(true)
      expect(rules.find((r) => r.label.includes('número'))?.isValid).toBe(false)
      expect(rules.find((r) => r.label.includes('símbolo'))?.isValid).toBe(false)
    })
  })
})
