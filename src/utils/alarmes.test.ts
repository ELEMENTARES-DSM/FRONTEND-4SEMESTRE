import { describe, expect, it } from 'vitest'
import { FUSO_HORARIO_ALARMES, formatarDataHora, formatarValorLimite } from './alarmes'

describe('utils de alarmes (US-24)', () => {
  it('mostra o horário de Brasília, qualquer que seja o fuso da máquina (o CI roda em UTC)', () => {
    expect(FUSO_HORARIO_ALARMES).toBe('America/Sao_Paulo')
    expect(formatarDataHora('2026-10-24T13:00:00.000Z')).toBe('24/10/2026, 10:00:00')
    // Perto da meia-noite em UTC a data muda: 02:30 UTC ainda é o dia anterior em Brasília.
    expect(formatarDataHora('2026-10-25T02:30:00.000Z')).toBe('24/10/2026, 23:30:00')
  })

  it('sem horário ou com horário inválido mostra um traço', () => {
    expect(formatarDataHora(null)).toBe('—')
    expect(formatarDataHora('não é data')).toBe('—')
  })

  it('valor × limite com o símbolo do operador e a unidade', () => {
    expect(formatarValorLimite({ valor: 52.3, operador: '>=', limite: 50, sensor_unidade_medida: 'µg/m³' })).toBe(
      '52,3 µg/m³ ≥ 50 µg/m³',
    )
  })
})
