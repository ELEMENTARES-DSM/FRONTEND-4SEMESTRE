import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SensorCreateModal } from './SensorCreateModal'
import { createSensor, getTiposSensor, type Sensor, type TipoSensor } from '../../services/sensoresService'

vi.mock('../../services/sensoresService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/sensoresService')>()),
  createSensor: vi.fn(),
  getTiposSensor: vi.fn(),
}))

const ESTACAO = '11111111-1111-4111-8111-111111111111'
const criarSensor = vi.mocked(createSensor)
const buscarGrandezas = vi.mocked(getTiposSensor)

const grandeza = (nome: string, unidade: string, faixa_min: string, faixa_max: string): TipoSensor => ({
  id: `id-${nome}`, nome, unidade, faixa_min, faixa_max, agregacao: 'media',
})
// Parte da carga inicial do catálogo, mais uma grandeza que o código antigo não conhecia.
const CATALOGO: TipoSensor[] = [
  grandeza('Temperatura', '°C', '-50.00', '60.00'),
  grandeza('Direção do Vento', '°', '0.00', '360.00'),
  grandeza('Precipitação', 'mm', '0.00', '500.00'),
  grandeza('Pressão Atmosférica', 'hPa', '600.00', '1100.00'),
  grandeza('Nebulosidade', 'oitavos', '0.00', '8.00'),
]

const sensorCriado = (extras: Partial<Sensor> = {}): Sensor => ({
  id: 's-1', estacao_id: ESTACAO, grandeza: 'Temperatura', unidade: '°C',
  fator_conversao: 1, offset: 0, status: 'Ativo', ...extras,
})

const erroDaApi = (status: number, message?: string) =>
  new AxiosError('falhou', AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
    status, data: message ? { message } : {},
  } as AxiosResponse)

async function abrir() {
  const onClose = vi.fn()
  const onCreated = vi.fn()
  render(<SensorCreateModal estacaoId={ESTACAO} onClose={onClose} onCreated={onCreated} />)
  // Espera o catálogo carregar (a grandeza escolhida deixa de ser "Carregando…").
  await waitFor(() => expect(screen.getByLabelText('Grandeza')).not.toBeDisabled())
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

beforeEach(() => {
  vi.resetAllMocks()
  buscarGrandezas.mockResolvedValue(CATALOGO)
})

describe('SensorCreateModal: catálogo de grandezas (US-39)', () => {
  it('mostra "Carregando grandezas…" e não deixa cadastrar enquanto o catálogo não chega', async () => {
    let resolver: (lista: TipoSensor[]) => void = () => undefined
    buscarGrandezas.mockReturnValue(new Promise((resolve) => { resolver = resolve }))
    render(<SensorCreateModal estacaoId={ESTACAO} onClose={vi.fn()} onCreated={vi.fn()} />)

    expect(screen.getByRole('option', { name: 'Carregando grandezas…' })).toBeInTheDocument()
    expect(screen.getByLabelText('Grandeza')).toBeDisabled()
    expect(screen.getByRole('button', { name: /cadastrar sensor/i })).toBeDisabled()

    resolver(CATALOGO)

    await waitFor(() => expect(screen.getByLabelText('Grandeza')).not.toBeDisabled())
    expect(screen.getByRole('button', { name: /cadastrar sensor/i })).not.toBeDisabled()
  })

  it('lista as grandezas do catálogo, inclusive as que não estavam no código, e começa pela primeira', async () => {
    await abrir()

    expect(buscarGrandezas).toHaveBeenCalledTimes(1)
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(CATALOGO.map((g) => g.nome))
    expect(screen.getByLabelText('Grandeza')).toHaveValue('Temperatura')
    expect(screen.getByLabelText('Unidade de medida')).toHaveValue('°C')
  })

  it('troca a unidade de medida junto com a grandeza escolhida', async () => {
    await abrir()

    fireEvent.change(screen.getByLabelText('Grandeza'), { target: { value: 'Precipitação' } })
    expect(screen.getByLabelText('Unidade de medida')).toHaveValue('mm')

    fireEvent.change(screen.getByLabelText('Grandeza'), { target: { value: 'Nebulosidade' } })
    expect(screen.getByLabelText('Unidade de medida')).toHaveValue('oitavos')
  })

  it('envia o nome da grandeza do catálogo como tipo (Direção do Vento)', async () => {
    const { onCreated } = await abrir()
    criarSensor.mockResolvedValue(sensorCriado({ grandeza: 'Direção do Vento', unidade: '°' }))

    preencher('DIR-01', 'Anemômetro')
    fireEvent.change(screen.getByLabelText('Grandeza'), { target: { value: 'Direção do Vento' } })
    enviar()

    await waitFor(() => expect(criarSensor).toHaveBeenCalledTimes(1))
    expect(criarSensor).toHaveBeenCalledWith(ESTACAO, {
      codigo: 'DIR-01', nome: 'Anemômetro', tipo: 'Direção do Vento', fator_conversao: 1, offset: 0,
    })
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1))
  })

  describe('quando o catálogo não carrega', () => {
    it('avisa, mantém o cadastro bloqueado e carrega ao tentar de novo', async () => {
      buscarGrandezas.mockRejectedValueOnce(new Error('rede'))
      render(<SensorCreateModal estacaoId={ESTACAO} onClose={vi.fn()} onCreated={vi.fn()} />)

      expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível carregar as grandezas/i)
      expect(screen.getByLabelText('Grandeza')).toBeDisabled()
      expect(screen.getByRole('button', { name: /cadastrar sensor/i })).toBeDisabled()

      fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }))

      await waitFor(() => expect(screen.getByLabelText('Grandeza')).not.toBeDisabled())
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(buscarGrandezas).toHaveBeenCalledTimes(2)
      expect(screen.getByLabelText('Grandeza')).toHaveValue('Temperatura')
    })

    it('avisa quando o catálogo vem vazio', async () => {
      buscarGrandezas.mockResolvedValue([])
      render(<SensorCreateModal estacaoId={ESTACAO} onClose={vi.fn()} onCreated={vi.fn()} />)

      expect(await screen.findByRole('option', { name: 'Nenhuma grandeza disponível' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cadastrar sensor/i })).toBeDisabled()
    })
  })
})

describe('SensorCreateModal: unidade da leitura (US-39)', () => {
  it('explica que o campo é opcional e informativo', async () => {
    await abrir()

    expect(screen.getByLabelText('Unidade da leitura (opcional)')).toHaveValue('')
    expect(screen.getByText(/deixe vazio se a placa já envia na unidade da grandeza/i)).toBeInTheDocument()
  })

  it('não manda unidade_leitura quando o campo fica vazio ou só com espaços', async () => {
    await abrir()
    criarSensor.mockResolvedValue(sensorCriado())

    preencher('TEMP-01', 'Temperatura')
    fireEvent.change(screen.getByLabelText('Unidade da leitura (opcional)'), { target: { value: '   ' } })
    enviar()

    await waitFor(() => expect(criarSensor).toHaveBeenCalledTimes(1))
    expect(criarSensor.mock.calls[0][1]).not.toHaveProperty('unidade_leitura')
  })

  it('manda unidade_leitura, fator_conversao e offset quando o sensor é em Kelvin (Cenário 5)', async () => {
    await abrir()
    criarSensor.mockResolvedValue(sensorCriado({ unidade_leitura: 'K', offset: -273.15 }))

    preencher('TEMP-K', 'Termômetro em Kelvin')
    fireEvent.change(screen.getByLabelText('Unidade da leitura (opcional)'), { target: { value: ' K ' } })
    fireEvent.change(screen.getByLabelText('Offset'), { target: { value: '-273.15' } })
    enviar()

    await waitFor(() => expect(criarSensor).toHaveBeenCalledTimes(1))
    expect(criarSensor).toHaveBeenCalledWith(ESTACAO, {
      codigo: 'TEMP-K', nome: 'Termômetro em Kelvin', tipo: 'Temperatura',
      unidade_leitura: 'K', fator_conversao: 1, offset: -273.15,
    })
  })

  it.each([
    [20, true],
    [21, false],
  ])('unidade da leitura com %i caracteres: aceita? %s', async (tamanho, aceita) => {
    await abrir()
    criarSensor.mockResolvedValue(sensorCriado())

    preencher('TEMP-01', 'Temperatura')
    // O campo limita a digitação a 20 pelo maxLength; o envio também confere o tamanho.
    fireEvent.change(screen.getByLabelText('Unidade da leitura (opcional)'), { target: { value: 'u'.repeat(tamanho) } })
    enviar()

    if (aceita) {
      await waitFor(() => expect(criarSensor).toHaveBeenCalledTimes(1))
    } else {
      expect(await screen.findByRole('alert')).toHaveTextContent(/até 20 caracteres na unidade da leitura/i)
      expect(criarSensor).not.toHaveBeenCalled()
    }
  })
})

describe('SensorCreateModal: código do sensor (US-39)', () => {
  it('exige o código, que é o que a placa envia', async () => {
    await abrir()

    preencher('   ', 'Sensor sem código')
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent(/preencha o código e o nome/i)
    expect(criarSensor).not.toHaveBeenCalled()
    expect(screen.getByText(/use o mesmo código que a placa envia/i)).toBeInTheDocument()
  })

  it('mostra a mensagem da API quando o código já existe na estação (409)', async () => {
    await abrir()
    criarSensor.mockRejectedValue(erroDaApi(409, 'Já existe um sensor com o código "TEMP-01" nesta estação.'))

    preencher('TEMP-01', 'Temperatura')
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um sensor com o código "TEMP-01" nesta estação.')
  })

  it('mostra a mensagem da API quando a estação já tem sensor da grandeza (409)', async () => {
    await abrir()
    criarSensor.mockRejectedValue(erroDaApi(409, 'Esta estação já possui um sensor de Temperatura cadastrado'))

    preencher('TEMP-02', 'Outra temperatura')
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Esta estação já possui um sensor de Temperatura cadastrado')
  })

  it('usa o texto padrão do 409 quando a API não manda mensagem', async () => {
    await abrir()
    criarSensor.mockRejectedValue(erroDaApi(409))

    preencher('TEMP-01', 'Temperatura')
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent(/já existe um sensor com este código ou grandeza nesta estação/i)
  })

  it('mostra a mensagem da API quando a grandeza não existe mais no catálogo (400)', async () => {
    await abrir()
    criarSensor.mockRejectedValue(erroDaApi(400, 'Tipo de sensor "Nebulosidade" não existe no catálogo de grandezas.'))

    preencher('NEB-01', 'Nebulosidade')
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent('não existe no catálogo de grandezas')
  })

  it('não repete o envelope genérico "Dados inválidos" do 400', async () => {
    await abrir()
    criarSensor.mockRejectedValue(erroDaApi(400, 'Dados inválidos'))

    preencher('TEMP-01', 'Temperatura')
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível cadastrar o sensor/i)
  })

  it.each([
    [401, /sua sessão expirou/i],
    [403, /não tem permissão/i],
    [500, /não foi possível cadastrar o sensor/i],
  ])('responde ao status %i com a mensagem certa', async (status, texto) => {
    await abrir()
    criarSensor.mockRejectedValue(erroDaApi(status))

    preencher('TEMP-01', 'Temperatura')
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent(texto)
  })
})

describe('SensorCreateModal: fator de conversão e offset (US-39)', () => {
  it('mostra "Fator de conversão" e "Offset", com a fórmula, e nunca a palavra "Ganho"', async () => {
    await abrir()

    expect(screen.getByLabelText('Fator de conversão')).toHaveValue(1)
    expect(screen.getByLabelText('Offset')).toHaveValue(0)
    expect(screen.getByText(/valor = leitura × fator de conversão \+ offset/i)).toBeInTheDocument()
    expect(screen.getByText(/mantenha fator 1 e offset 0/i)).toBeInTheDocument()
    expect(screen.queryByText(/ganho/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/ganho/i)).not.toBeInTheDocument()
  })

  it.each([
    ['999999.999999', true],
    ['1000000', false],
  ])('aceita offset %s? %s (limite do NUMERIC(12,6))', async (valor, aceito) => {
    await abrir()
    criarSensor.mockResolvedValue(sensorCriado({ offset: Number(valor) }))

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
