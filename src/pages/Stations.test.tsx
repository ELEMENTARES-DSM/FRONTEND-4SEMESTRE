import type { ReactElement } from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { Stations, type Station } from './Stations'
import api from '../api/instance'
import { AuthContext } from '../auth/AuthContext'

type Papel = 'ADMINISTRADOR' | 'GESTOR_PUBLICO' | 'PESQUISADOR'

// O perfil vem sempre do AuthContext, como no app (sem usuário de teste no localStorage).
function renderAs(
  papel: Papel,
  ui: ReactElement,
  municipio: string | null = papel === 'GESTOR_PUBLICO' ? 'São José dos Campos' : null,
) {
  return render(
    <AuthContext.Provider
      value={{
        token: 'token-teste',
        usuario: { id: `user-${papel}`, nome: `Usuário ${papel}`, papel, municipio },
        login: vi.fn(),
        logout: vi.fn(),
      }}
    >
      {ui}
    </AuthContext.Provider>,
  )
}

function preencherCadastro({
  codigo = 'EST-SJC-099',
  nome = 'Localidade Qualquer',
  latitude = '-23.1534',
  longitude = '-45.7922',
  municipio,
}: {
  codigo?: string
  nome?: string
  latitude?: string
  longitude?: string
  municipio?: string
}) {
  fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))
  fireEvent.change(screen.getByLabelText(/Código da Estação/i), { target: { value: codigo } })
  fireEvent.change(screen.getByLabelText(/Nome da Localidade/i), { target: { value: nome } })
  if (municipio !== undefined) {
    fireEvent.change(screen.getByLabelText(/Município/i), { target: { value: municipio } })
  }
  fireEvent.change(screen.getByLabelText(/Latitude/i), { target: { value: latitude } })
  fireEvent.change(screen.getByLabelText(/Longitude/i), { target: { value: longitude } })
}

const salvar = () => fireEvent.click(screen.getByRole('button', { name: /Salvar Estação/i }))

// Resposta no formato real do back: NUMERIC como string e sem campo "ativo".
const respostaDoBack = (extra: Record<string, unknown> = {}) => ({
  data: {
    id: 'est-new-001',
    codigo: 'EST-SJC-099',
    nome: 'Localidade Qualquer',
    municipio: 'São José dos Campos',
    latitude: '-23.153400',
    longitude: '-45.792200',
    status: 'Ativa',
    nivel_bateria: null,
    ultimo_ping: null,
    criado_em: '2026-09-26T12:00:00Z',
    ...extra,
  },
})

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

const ESTACAO_COM_FALHA: Station = {
  id: 'est-009',
  codigo: 'EST-FALHA-01',
  nome: 'Estação com falha',
  municipio: 'São José dos Campos',
  coordenadas: { latitude: -23.21, longitude: -45.85 },
  status: 'Com Falha',
  ativo: true,
}

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.stubEnv('VITE_USE_MOCKS', 'false')
})

describe('Componente Stations - Casos de Uso BDD / Gherkin', () => {
  it('Cenário 1: Cadastro de estação com sucesso pelo Gestor Público', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce(respostaDoBack())

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)
    preencherCadastro({ latitude: '-23.153400', longitude: '-45.792200' })
    salvar()

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/estacoes', {
        codigo: 'EST-SJC-099',
        nome: 'Localidade Qualquer',
        latitude: -23.1534,
        longitude: -45.7922,
      })
    })

    expect(
      await screen.findByText('Estação meteorológica cadastrada com sucesso'),
    ).toBeInTheDocument()

    // O status "Ativa" vem do back, não do formulário
    const row = screen.getByRole('row', { name: /EST-SJC-099/i })
    expect(row).toHaveTextContent('Ativa')
    expect(row).toHaveTextContent('-23.1534, -45.7922')
  })

  it('Cenário 2: Tentativa de cadastro com código identificador já existente', async () => {
    const postSpy = vi.spyOn(api, 'post').mockRejectedValueOnce({
      response: { status: 409, data: { message: 'Conflict' } },
      status: 409,
    })

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[MOCK_STATIONS[0]]} />)
    preencherCadastro({ codigo: 'EST-SJC-001' })
    salvar()

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalled()
    })
    expect(
      await screen.findByText('Identificador de estação já cadastrado no sistema'),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('Cenário 3: Tentativa de cadastro com coordenadas geográficas inválidas (latitude > 90)', () => {
    const postSpy = vi.spyOn(api, 'post')

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)
    preencherCadastro({ latitude: '92.500000' })
    salvar()

    expect(postSpy).not.toHaveBeenCalled()
    expect(
      screen.getByText('Coordenadas geográficas fora dos limites válidos'),
    ).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('Cenário 4: Desativação lógica de estação meteorológica', async () => {
    const patchSpy = vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: {} })

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[MOCK_STATIONS[0]]} />)

    expect(screen.getByRole('row', { name: /EST-SJC-001/i })).toHaveTextContent('Ativa')

    fireEvent.click(
      screen.getByRole('switch', { name: /Alternar status da estação EST-SJC-001/i }),
    )

    await waitFor(() => {
      expect(patchSpy).toHaveBeenCalledWith('/estacoes/est-001/status', {
        ativo: false,
        status: 'Inativa',
      })
    })

    // A estação não é removida da tabela e o badge fica cinza
    const rowAfter = await screen.findByRole('row', { name: /EST-SJC-001/i })
    expect(rowAfter).toHaveTextContent('Inativa')
    const badge = rowAfter.querySelector('.bg-neutral\\/40')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Inativa')
  })
})

describe('Validação de coordenadas no cliente (RN-03)', () => {
  it('bloqueia longitude fora de [-180, 180]', () => {
    const postSpy = vi.spyOn(api, 'post')

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)
    preencherCadastro({ longitude: '-180.5' })
    salvar()

    expect(postSpy).not.toHaveBeenCalled()
    expect(
      screen.getByText('Coordenadas geográficas fora dos limites válidos'),
    ).toBeInTheDocument()
  })

  it.each([
    ['90.0001', '0'],
    ['-90.0001', '0'],
    ['0', '180.0001'],
    ['0', '-180.0001'],
  ])('bloqueia o valor logo além do limite (lat %s, lon %s)', (latitude, longitude) => {
    const postSpy = vi.spyOn(api, 'post')

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)
    preencherCadastro({ latitude, longitude })
    salvar()

    expect(postSpy).not.toHaveBeenCalled()
  })

  it.each([
    ['90', '180', 90, 180],
    ['-90', '-180', -90, -180],
  ])('aceita os limites exatos (lat %s, lon %s)', async (latitude, longitude, lat, lon) => {
    const postSpy = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce(respostaDoBack({ latitude: String(lat), longitude: String(lon) }))

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)
    preencherCadastro({ latitude, longitude })
    salvar()

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/estacoes',
        expect.objectContaining({ latitude: lat, longitude: lon }),
      )
    })
  })
})

describe('Status "Com Falha" (valores do back: Ativa, Inativa, Com Falha)', () => {
  it('exibe badge de alerta, conta no cabeçalho e tem filtro próprio', () => {
    renderAs('GESTOR_PUBLICO', <Stations initialStations={[...MOCK_STATIONS, ESTACAO_COM_FALHA]} />)

    const row = screen.getByRole('row', { name: /EST-FALHA-01/i })
    const badge = row.querySelector('.bg-warning\\/15')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Com Falha')

    expect(screen.getByText(/4 estações cadastradas · 2 ativas · 1 com falha/i)).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Manutenção/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /Instalação/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /Com Falha/i }))
    expect(screen.getByText('EST-FALHA-01')).toBeInTheDocument()
    expect(screen.queryByText('EST-SJC-001')).not.toBeInTheDocument()
    expect(screen.queryByText('EST-CAC-001')).not.toBeInTheDocument()
  })

  it('não permite alternar o switch de uma estação Com Falha (o status não é apagado)', () => {
    const patchSpy = vi.spyOn(api, 'patch')

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[ESTACAO_COM_FALHA]} />)

    const toggle = screen.getByRole('switch', {
      name: /Alternar status da estação EST-FALHA-01/i,
    })
    expect(toggle).toBeDisabled()
    fireEvent.click(toggle)

    expect(patchSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('row', { name: /EST-FALHA-01/i })).toHaveTextContent('Com Falha')
  })
})

describe('Componente Stations - Funcionalidades adicionais', () => {
  it('renderiza o cabeçalho, contadores e lista inicial de estações', () => {
    renderAs('GESTOR_PUBLICO', <Stations initialStations={MOCK_STATIONS} />)

    expect(
      screen.getByRole('heading', { name: /Inventário de Estações/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/3 estações cadastradas · 2 ativas/i)).toBeInTheDocument()
    expect(screen.getByText('EST-SJC-001')).toBeInTheDocument()
    expect(screen.getByText('EST-SJC-002')).toBeInTheDocument()
    expect(screen.getByText('EST-CAC-001')).toBeInTheDocument()
  })

  it('usa o singular quando há uma estação', () => {
    renderAs('GESTOR_PUBLICO', <Stations initialStations={[MOCK_STATIONS[0]]} />)

    expect(screen.getByText('1 estação cadastrada · 1 ativa')).toBeInTheDocument()
  })

  it('filtra as estações por status utilizando o componente Filter', () => {
    renderAs('GESTOR_PUBLICO', <Stations initialStations={MOCK_STATIONS} />)

    fireEvent.click(screen.getByRole('radio', { name: /Inativas/i }))

    expect(screen.getByText('EST-CAC-001')).toBeInTheDocument()
    expect(screen.queryByText('EST-SJC-001')).not.toBeInTheDocument()
    expect(screen.queryByText('EST-SJC-002')).not.toBeInTheDocument()
  })

  it('filtra as estações por termo de busca', () => {
    renderAs('GESTOR_PUBLICO', <Stations initialStations={MOCK_STATIONS} />)

    fireEvent.change(screen.getByPlaceholderText(/Buscar por código ou localidade.../i), {
      target: { value: 'Satélite' },
    })

    expect(screen.getByText('EST-SJC-002')).toBeInTheDocument()
    expect(screen.queryByText('EST-SJC-001')).not.toBeInTheDocument()
    expect(screen.queryByText('EST-CAC-001')).not.toBeInTheDocument()
  })

  it('exibe modal de detalhes ao clicar no código da estação e fecha ao clicar em Fechar', () => {
    renderAs('GESTOR_PUBLICO', <Stations initialStations={MOCK_STATIONS} />)

    fireEvent.click(screen.getByRole('button', { name: 'EST-SJC-001' }))

    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByRole('heading', { name: 'Detalhes da Estação - EST-SJC-001' }),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('São José dos Campos - Centro')).toBeInTheDocument()
    expect(within(dialog).getByText('São José dos Campos')).toBeInTheDocument()

    fireEvent.click(within(dialog).getByText('Fechar'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('valida campos obrigatórios não preenchidos no formulário', () => {
    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))
    fireEvent.submit(screen.getByRole('button', { name: /Salvar Estação/i }).closest('form')!)

    expect(
      screen.getByText('Por favor, preencha todos os campos obrigatórios.'),
    ).toBeInTheDocument()
  })

  it('fecha o modal de cadastro ao clicar em Cancelar', () => {
    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))
    expect(screen.getByRole('heading', { name: 'Nova Estação' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(screen.queryByRole('heading', { name: 'Nova Estação' })).not.toBeInTheDocument()
  })

  it('permite cadastrar e listar estação quando VITE_USE_MOCKS=true sem acionar api', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true')
    const postSpy = vi.spyOn(api, 'post')

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)
    preencherCadastro({ codigo: 'EST-MOCK-TEST', nome: 'Estação Mock' })
    salvar()

    expect(
      await screen.findByText('Estação meteorológica cadastrada com sucesso'),
    ).toBeInTheDocument()
    expect(postSpy).not.toHaveBeenCalled()
    expect(screen.getByText('EST-MOCK-TEST')).toBeInTheDocument()
  })

  it('exibe o erro de carga com "Tentar novamente" em vez de lista vazia', async () => {
    const getSpy = vi
      .spyOn(api, 'get')
      .mockRejectedValueOnce(new Error('Request failed with status code 500'))
      .mockResolvedValueOnce({
        data: [{ ...respostaDoBack().data, id: 'est-001', codigo: 'EST-SJC-001' }],
      })

    renderAs('GESTOR_PUBLICO', <Stations />)

    expect(await screen.findByText('Não foi possível carregar as estações.')).toBeInTheDocument()
    expect(screen.queryByText('Nenhuma estação cadastrada.')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }))

    expect(await screen.findByText('EST-SJC-001')).toBeInTheDocument()
    expect(screen.queryByText('Não foi possível carregar as estações.')).not.toBeInTheDocument()
    expect(getSpy).toHaveBeenCalledTimes(2)
  })
})

describe('Controle de Acesso e Autorização - Componente Stations', () => {
  it('permite que ADMINISTRADOR visualize lista de estações, botão de criação e Toggle', () => {
    renderAs('ADMINISTRADOR', <Stations initialStations={MOCK_STATIONS} />)

    expect(screen.getByRole('heading', { name: /Inventário de Estações/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /\+ Nova Estação/i })).toBeInTheDocument()
    expect(screen.getByText('EST-SJC-001')).toBeInTheDocument()
    expect(
      screen.getByRole('switch', { name: /Alternar status da estação EST-SJC-001/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Você não possui permissão para visualizar/i)).not.toBeInTheDocument()
  })

  it('bloqueia PESQUISADOR: não exibe lista de estações e renderiza mensagem de Acesso Negado', () => {
    renderAs('PESQUISADOR', <Stations initialStations={MOCK_STATIONS} />)

    expect(screen.getByRole('alert', { name: /Acesso negado/i })).toBeInTheDocument()
    expect(
      screen.getByText('Você não possui permissão para visualizar o inventário de estações.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('EST-SJC-001')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /\+ Nova Estação/i })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('switch', { name: /Alternar status da estação EST-SJC-001/i }),
    ).not.toBeInTheDocument()
  })

  it('impede chamada GET /estacoes quando usuário é PESQUISADOR sem permissão de visualização', () => {
    const getSpy = vi.spyOn(api, 'get')

    renderAs('PESQUISADOR', <Stations />)

    expect(getSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('alert', { name: /Acesso negado/i })).toBeInTheDocument()
  })

  it('não trata como autorizado um papel gravado solto no localStorage', () => {
    localStorage.setItem('userRole', 'ADMINISTRADOR')

    render(<Stations initialStations={MOCK_STATIONS} />)

    expect(screen.getByRole('alert', { name: /Acesso negado/i })).toBeInTheDocument()
  })

  it('exibe mensagem apropriada quando a API retorna erro HTTP 403 com mensagem de perfil insuficiente', async () => {
    vi.spyOn(api, 'post').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 403,
        data: { erro: 'Acesso negado. Perfil insuficiente para esta ação.' },
      },
    })

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)
    preencherCadastro({ codigo: 'EST-SJC-999' })
    salvar()

    expect(
      await screen.findByText('Acesso negado. Perfil insuficiente para esta ação.'),
    ).toBeInTheDocument()
  })

  it('exibe mensagem apropriada quando a API retorna erro HTTP 403 ao alternar status da estação', async () => {
    vi.spyOn(api, 'patch').mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 403,
        data: { erro: 'Acesso negado. Perfil insuficiente para esta ação.' },
      },
    })

    renderAs('ADMINISTRADOR', <Stations initialStations={[MOCK_STATIONS[0]]} />)

    fireEvent.click(
      screen.getByRole('switch', { name: /Alternar status da estação EST-SJC-001/i }),
    )

    expect(
      await screen.findByText('Acesso negado. Perfil insuficiente para esta ação.'),
    ).toBeInTheDocument()
  })
})

describe('US-03 - Município da estação', () => {
  it('GESTOR_PUBLICO não envia município: o back usa o do JWT', async () => {
    const postSpy = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce(respostaDoBack({ codigo: 'EST-TAU-001', municipio: 'Taubaté' }))

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />, 'Taubaté')
    preencherCadastro({ codigo: 'EST-TAU-001' })
    salvar()

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalled()
    })
    const corpo = postSpy.mock.calls[0][1]
    expect(corpo).not.toHaveProperty('municipio')
    expect(corpo).not.toHaveProperty('status')
    expect(
      await screen.findByText('Estação meteorológica cadastrada com sucesso'),
    ).toBeInTheDocument()
  })

  it('não disponibiliza campo de município para GESTOR_PUBLICO', () => {
    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /\+ Nova Estação/i }))

    expect(screen.queryByLabelText(/município/i)).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/município/i)).not.toBeInTheDocument()
  })

  it.each([
    ['nulo', null],
    ['vazio/espaços', '   '],
  ])('bloqueia o cadastro do GESTOR_PUBLICO com município %s na sessão', async (_caso, municipio) => {
    const postSpy = vi.spyOn(api, 'post')

    renderAs('GESTOR_PUBLICO', <Stations initialStations={[]} />, municipio)
    preencherCadastro({})
    salvar()

    expect(postSpy).not.toHaveBeenCalled()
    expect(
      await screen.findByText('Município do usuário não identificado para vincular à estação.'),
    ).toBeInTheDocument()
  })

  it('ADMINISTRADOR (sem município no JWT) informa o município e o envia no POST', async () => {
    const postSpy = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce(respostaDoBack({ codigo: 'EST-JAC-001', municipio: 'Jacareí' }))

    renderAs('ADMINISTRADOR', <Stations initialStations={[]} />)
    preencherCadastro({ codigo: 'EST-JAC-001', municipio: '  Jacareí ' })
    salvar()

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/estacoes', {
        codigo: 'EST-JAC-001',
        nome: 'Localidade Qualquer',
        municipio: 'Jacareí',
        latitude: -23.1534,
        longitude: -45.7922,
      })
    })
    expect(
      await screen.findByText('Estação meteorológica cadastrada com sucesso'),
    ).toBeInTheDocument()
  })

  it('ADMINISTRADOR sem município preenchido não envia o POST', () => {
    const postSpy = vi.spyOn(api, 'post')

    renderAs('ADMINISTRADOR', <Stations initialStations={[]} />)
    preencherCadastro({})
    fireEvent.submit(screen.getByRole('button', { name: /Salvar Estação/i }).closest('form')!)

    expect(postSpy).not.toHaveBeenCalled()
    expect(screen.getByText('Informe o município da estação.')).toBeInTheDocument()
  })
})
