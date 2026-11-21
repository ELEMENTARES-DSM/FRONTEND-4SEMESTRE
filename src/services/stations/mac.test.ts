import { describe, expect, it } from 'vitest'
import { normalizarMac } from './mac'

describe('normalizarMac', () => {
  it.each([
    ['aabbccddeeff', 'aabbccddeeff'],
    ['AABBCCDDEEFF', 'aabbccddeeff'],
    ['AA:BB:CC:DD:EE:FF', 'aabbccddeeff'],
    ['aa-bb-cc-dd-ee-ff', 'aabbccddeeff'],
    ['  AA:BB:CC:DD:EE:FF  ', 'aabbccddeeff'],
  ])('devolve %s como %s', (entrada, esperado) => {
    expect(normalizarMac(entrada)).toBe(esperado)
  })

  it.each(['', 'aabbccddeef', 'gabbccddeeff', 'AA:BB-CC:DD:EE:FF', 'AA:BB:CC:DD:EE'])(
    'recusa %j',
    (entrada) => {
      expect(normalizarMac(entrada)).toBeNull()
    },
  )
})
