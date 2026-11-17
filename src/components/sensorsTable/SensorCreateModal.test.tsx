import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SensorCreateModal } from './SensorCreateModal'
import { createSensor } from '../../services/sensoresService'

vi.mock('../../services/sensoresService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/sensoresService')>()),
  createSensor: vi.fn(),
}))

const ESTACAO = '11111111-1111-4111-8111-111111111111'
const criarSensor = vi.mocked(createSensor)

function abrir() {
  const onClose = vi.fn()
  const onCreated = vi.fn()
  render(<SensorCreateModal estacaoId={ESTACAO} onClose={onClose} onCreated={onCreated} />)
  return { onClose, onCreated }
}

// Dispara o envio do formulário direto: o happy-dom valida o step="0.000001" em ponto
// flutuante e recusa valores como -273,15, o que um navegador de verdade aceita.
function enviar() {
  fireEvent.submit(screen.getByRole('button', { name: /cadastrar sensor/i }).closest('form') as HTMLFormElement)
}

function preencher(codigo: string, nome: string) {
  fireEvent.change(screen.getByLabelText('Código'), { target: { value: codigo } })
  fireEvent.change(screen.getByLabelText('Nome do sensor'), { target: { value: nome } })
}

beforeEach(() => vi.resetAllMocks())

describe('SensorCreateModal: fator de conversão e offset (US-39)', () => {
  it('mostra "Fator de conversão" e "Offset", com a fórmula, e nunca a palavra "Ganho"', () => {
    abrir()

    expect(screen.getByLabelText('Fator de conversão')).toHaveValue(1)
    expect(screen.getByLabelText('Offset')).toHaveValue(0)
    expect(screen.getByText(/valor = leitura × fator de conversão \+ offset/i)).toBeInTheDocument()
    expect(screen.getByText(/mantenha fator 1 e offset 0/i)).toBeInTheDocument()
    expect(screen.queryByText(/ganho/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/ganho/i)).not.toBeInTheDocument()
  })

  it('envia fator_conversao e offset (Kelvin: fator 1 e offset -273,15)', async () => {
    const { onCreated } = abrir()
    criarSensor.mockResolvedValue({
      id: 's-1', estacao_id: ESTACAO, grandeza: 'Temperatura', unidade: '°C',
      fator_conversao: 1, offset: -273.15, status: 'Ativo',
    })

    preencher('TEMP-K', 'Termômetro em Kelvin')
    fireEvent.change(screen.getByLabelText('Offset'), { target: { value: '-273.15' } })
    enviar()

    await waitFor(() => expect(criarSensor).toHaveBeenCalledTimes(1))
    expect(criarSensor).toHaveBeenCalledWith(ESTACAO, {
      codigo: 'TEMP-K',
      nome: 'Termômetro em Kelvin',
      tipo: 'Temperatura',
      fator_conversao: 1,
      offset: -273.15,
    })
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
  })

  it.each([
    ['999999.999999', true],
    ['1000000', false],
  ])('aceita offset %s? %s (limite do NUMERIC(12,6))', async (valor, aceito) => {
    abrir()
    criarSensor.mockResolvedValue({
      id: 's-1', estacao_id: ESTACAO, grandeza: 'Temperatura', unidade: '°C',
      fator_conversao: 1, offset: Number(valor), status: 'Ativo',
    })

    preencher('TEMP-01', 'Temperatura')
    fireEvent.change(screen.getByLabelText('Offset'), { target: { value: valor } })
    enviar()

    if (aceito) {
      await waitFor(() => expect(criarSensor).toHaveBeenCalledTimes(1))
    } else {
      expect(await screen.findByRole('alert')).toHaveTextContent(/fator de conversão e o offset/i)
      expect(criarSensor).not.toHaveBeenCalled()
    }
  })
})
