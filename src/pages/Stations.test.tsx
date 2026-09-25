import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { Stations, type Station } from './Stations'
import api from '../api/instance'

const MOCK_STATIONS: Station[] = [
  {
    id: 'est-001',
    codigo: 'EST-SJC-001',
    nome: 'São José dos Campos - Centro',
    municipio: 'São José dos Campos',
    coordenadas: { latitude: -23.1791, longitude: -45.8872 },
    status: 'Ativa',
    ativo: true,
  },
  {
    id: 'est-002',
    codigo: 'EST-SJC-002',
    nome: 'São José dos Campos - Satélite',
    municipio: 'São José dos Campos',
    coordenadas: { latitude: -23.2237, longitude: -45.8914 },
    status: 'Ativa',
    ativo: true,
  },
  {
    id: 'est-005',
    codigo: 'EST-CAC-001',
    nome: 'Caçapava - Centro',
    municipio: 'Caçapava',
    coordenadas: { latitude: -23.1008, longitude: -45.7072 },
    status: 'Inativa',
    ativo: false,
  },
]

describe('Componente Stations - Casos de Uso BDD / Gherkin', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.stubEnv('VITE_USE_MOCK', 'false')
  })

  it('Cenário 1: Cadastro de estação com sucesso pelo Gestor Público', async () => {
    // Dado que o usuário está autenticado como "GESTOR_PUBLICO" do município "São José dos Campos"
    localStorage.setItem('userRole', 'GESTOR_PUBLICO')
    localStorage.setItem('userMunicipio', 'São José dos Campos')

    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        id: 'est-new-001',
        codigo: 'EST-SJC-001',
        nome: 'Estação Parque Tecnológico',
        municipio: 'São José dos Campos',
        coordenadas: { latitude: -23.1534, longitude: -45.7922 },
        status: 'Ativa',
        ativo: true,
      },
    })

    // Renderiza a página inicialmente sem a estação a ser cadastrada
    render(<Stations initialStations={[]} />)

    // Abre o formulário de cadastro
    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))

    // Quando preenche o código "EST-SJC-001" e o nome "Estação Parque Tecnológico"
    fireEvent.change(screen.getByLabelText(/Código da Estação/i), {
      target: { value: 'EST-SJC-001' },
    })
    fireEvent.change(screen.getByLabelText(/Nome da Localidade/i), {
      target: { value: 'Estação Parque Tecnológico' },
    })

    // E informa a latitude "-23.153400" e a longitude "-45.792200"
    fireEvent.change(screen.getByLabelText(/Latitude/i), {
      target: { value: '-23.153400' },
    })
    fireEvent.change(screen.getByLabelText(/Longitude/i), {
      target: { value: '-45.792200' },
    })

    // E submete o formulário de cadastro
    fireEvent.click(screen.getByRole('button', { name: /Salvar Estação/i }))

    // Então o sistema deve registrar a estação vinculada ao município "São José dos Campos"
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/estacoes',
        expect.objectContaining({
          codigo: 'EST-SJC-001',
          nome: 'Estação Parque Tecnológico',
          municipio: 'São José dos Campos',
          latitude: -23.1534,
          longitude: -45.7922,
          status: 'Ativa',
        }),
      )
    })

    // E a interface deve exibir a mensagem "Estação meteorológica cadastrada com sucesso"
    expect(
      await screen.findByText('Estação meteorológica cadastrada com sucesso'),
    ).toBeInTheDocument()

    // E o status operacional deve ser persistido como "Ativa" na listagem
    const row = screen.getByRole('row', { name: /EST-SJC-001/i })
    expect(row).toHaveTextContent('Ativa')
    expect(row).toHaveTextContent('Estação Parque Tecnológico')
  })

  it('Cenário 2: Tentativa de cadastro com código identificador já existente', async () => {
    // Dado que já existe uma estação com o código identificador "EST-SJC-001" cadastrada no sistema
    const existingStation: Station = {
      id: 'est-001',
      codigo: 'EST-SJC-001',
      nome: 'São José dos Campos - Centro',
      municipio: 'São José dos Campos',
      coordenadas: { latitude: -23.1791, longitude: -45.8872 },
      status: 'Ativa',
      ativo: true,
    }

    const postSpy = vi.spyOn(api, 'post').mockRejectedValueOnce({
      response: {
        status: 409,
        data: { message: 'Conflict' },
      },
      status: 409,
    })

    render(<Stations initialStations={[existingStation]} />)

    // Quando o gestor tentar cadastrar uma nova estação utilizando o mesmo código "EST-SJC-001"
    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))

    fireEvent.change(screen.getByLabelText(/Código da Estação/i), {
      target: { value: 'EST-SJC-001' },
    })
    fireEvent.change(screen.getByLabelText(/Nome da Localidade/i), {
      target: { value: 'Nova Unidade Parque Tecnológico' },
    })
    fireEvent.change(screen.getByLabelText(/Latitude/i), {
      target: { value: '-23.1534' },
    })
    fireEvent.change(screen.getByLabelText(/Longitude/i), {
      target: { value: '-45.7922' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Salvar Estação/i }))

    // Então o backend deve recursar a requisição com o código HTTP 409 (Conflict)
    await waitFor(() => {
      expect(postSpy).toHaveBeenCalled()
    })

    // E a aplicação deve exibir o alerta "Identificador de estação já cadastrado no sistema"
    expect(
      await screen.findByText('Identificador de estação já cadastrado no sistema'),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('Cenário 3: Tentativa de cadastro com coordenadas geográficas inválidas (latitude > 90)', async () => {
    const postSpy = vi.spyOn(api, 'post')

    render(<Stations initialStations={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))

    // Dado que o gestor está preenchendo as coordenadas da estação
    fireEvent.change(screen.getByLabelText(/Código da Estação/i), {
      target: { value: 'EST-SJC-099' },
    })
    fireEvent.change(screen.getByLabelText(/Nome da Localidade/i), {
      target: { value: 'Localidade Qualquer' },
    })

    // Quando informa a latitude "92.500000" (superior a 90 graus)
    fireEvent.change(screen.getByLabelText(/Latitude/i), {
      target: { value: '92.500000' },
    })
    fireEvent.change(screen.getByLabelText(/Longitude/i), {
      target: { value: '-45.792200' },
    })

    // E tenta submeter o formulário
    fireEvent.click(screen.getByRole('button', { name: /Salvar Estação/i }))

    // Então o sistema deve impedir o envio antes da persistência
    expect(postSpy).not.toHaveBeenCalled()

    // E deve exibir a mensagem de validação "Coordenadas geográficas fora dos limites válidos"
    expect(
      screen.getByText('Coordenadas geográficas fora dos limites válidos'),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('Cenário 4: Desativação lógica de estação meteorológica', async () => {
    const patchSpy = vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: {} })

    // Dado que uma estação com status "Ativa" precisa ser recolhida para calibração
    const stationAtiva: Station = {
      id: 'est-001',
      codigo: 'EST-SJC-001',
      nome: 'São José dos Campos - Centro',
      municipio: 'São José dos Campos',
      coordenadas: { latitude: -23.1791, longitude: -45.8872 },
      status: 'Ativa',
      ativo: true,
    }

    render(<Stations initialStations={[stationAtiva]} />)

    // Valida status inicial ativo na tabela
    const rowBefore = screen.getByRole('row', { name: /EST-SJC-001/i })
    expect(rowBefore).toHaveTextContent('Ativa')

    // Quando o gestor acionar o comando de desativação na listagem
    const toggle = screen.getByRole('switch', {
      name: /Alternar status da estação EST-SJC-001/i,
    })
    fireEvent.click(toggle)

    // Então o status da estação deve ser atualizado para "Inativa" no backend / banco
    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith('/estacoes/est-001/status', {
        ativo: false,
        status: 'Inativa',
      })
    })

    // E a estação não deve ser removida fisicamente da tabela
    const rowAfter = await screen.findByRole('row', { name: /EST-SJC-001/i })
    expect(rowAfter).toBeInTheDocument()

    // E a interface deve atualizar o badge para a cor cinza com o rótulo "Inativa"
    expect(rowAfter).toHaveTextContent('Inativa')
    const badge = rowAfter.querySelector('.bg-neutral\\/40')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Inativa')
  })
})

describe('Componente Stations - Funcionalidades adicionais', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
    vi.stubEnv('VITE_USE_MOCK', 'false')
  })

  it('renderiza o cabeçalho, contadores e lista inicial de estações', () => {
    render(<Stations initialStations={MOCK_STATIONS} />)

    expect(
      screen.getByRole('heading', { name: /Inventário de Estações/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/3 estações cadastradas · 2 ativas/i)).toBeInTheDocument()
    expect(screen.getByText('EST-SJC-001')).toBeInTheDocument()
    expect(screen.getByText('EST-SJC-002')).toBeInTheDocument()
    expect(screen.getByText('EST-CAC-001')).toBeInTheDocument()
  })

  it('filtra as estações por status utilizando o componente Filter', () => {
    render(<Stations initialStations={MOCK_STATIONS} />)

    // Clica no filtro "Inativas"
    fireEvent.click(screen.getByRole('radio', { name: /Inativas/i }))

    // Deve exibir apenas Caçapava e esconder as ativas
    expect(screen.getByText('EST-CAC-001')).toBeInTheDocument()
    expect(screen.queryByText('EST-SJC-001')).not.toBeInTheDocument()
    expect(screen.queryByText('EST-SJC-002')).not.toBeInTheDocument()
  })

  it('filtra as estações por termo de busca', () => {
    render(<Stations initialStations={MOCK_STATIONS} />)

    const searchInput = screen.getByPlaceholderText(
      /Buscar por código ou localidade.../i,
    )
    fireEvent.change(searchInput, { target: { value: 'Satélite' } })

    expect(screen.getByText('EST-SJC-002')).toBeInTheDocument()
    expect(screen.queryByText('EST-SJC-001')).not.toBeInTheDocument()
    expect(screen.queryByText('EST-CAC-001')).not.toBeInTheDocument()
  })

  it('exibe modal de detalhes ao clicar no código da estação e fecha ao clicar em Fechar', () => {
    render(<Stations initialStations={MOCK_STATIONS} />)

    // Clica no código da estação
    fireEvent.click(screen.getByRole('button', { name: 'EST-SJC-001' }))

    // O modal com título e detalhes deve ser exibido
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(
      within(dialog).getByRole('heading', {
        name: 'Detalhes da Estação - EST-SJC-001',
      }),
    ).toBeInTheDocument()
    expect(
      within(dialog).getByText('São José dos Campos - Centro'),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('São José dos Campos')).toBeInTheDocument()

    // Clica em Fechar
    fireEvent.click(within(dialog).getByText('Fechar'))

    // Modal deve ser encerrado
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida campos obrigatórios não preenchidos no formulário', () => {
    render(<Stations initialStations={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))

    // Submete formulário com campos obrigatórios vazios
    const saveButton = screen.getByRole('button', { name: /Salvar Estação/i })
    const form = saveButton.closest('form')!
    fireEvent.submit(form)

    expect(
      screen.getByText('Por favor, preencha todos os campos obrigatórios.'),
    ).toBeInTheDocument()
  })

  it('fecha o modal de cadastro ao clicar em Cancelar', () => {
    render(<Stations initialStations={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))
    expect(screen.getByRole('heading', { name: 'Nova Estação' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(screen.queryByRole('heading', { name: 'Nova Estação' })).not.toBeInTheDocument()
  })

  it('permite cadastrar e listar estação quando VITE_USE_MOCK=true sem acionar api', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true')
    const postSpy = vi.spyOn(api, 'post')

    render(<Stations initialStations={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))

    fireEvent.change(screen.getByLabelText(/Código da Estação/i), {
      target: { value: 'EST-MOCK-TEST' },
    })
    fireEvent.change(screen.getByLabelText(/Nome da Localidade/i), {
      target: { value: 'Estação Mock' },
    })
    fireEvent.change(screen.getByLabelText(/Latitude/i), {
      target: { value: '-23.1234' },
    })
    fireEvent.change(screen.getByLabelText(/Longitude/i), {
      target: { value: '-45.5678' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Salvar Estação/i }))

    expect(
      await screen.findByText('Estação meteorológica cadastrada com sucesso'),
    ).toBeInTheDocument()

    expect(postSpy).not.toHaveBeenCalled()
    expect(screen.getByText('EST-MOCK-TEST')).toBeInTheDocument()
  })
})
