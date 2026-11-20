import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Grandezas } from './Grandezas'
import {
  atualizarGrandeza,
  criarGrandeza,
  excluirGrandeza,
  listarGrandezas,
  type Grandeza,
} from '../../services/tiposSensorService'

vi.mock('../../services/tiposSensorService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/tiposSensorService')>()),
  listarGrandezas: vi.fn(),
  criarGrandeza: vi.fn(),
  atualizarGrandeza: vi.fn(),
  excluirGrandeza: vi.fn(),
}))

const permissoes = vi.hoisted(() => ({ concedidas: [] as string[] }))
vi.mock('../../auth/useAuthorization', () => ({
  useAuthorization: () => ({ hasPermission: (p: string) => permissoes.concedidas.includes(p) }),
}))

const listar = vi.mocked(listarGrandezas)
const criar = vi.mocked(criarGrandeza)
const atualizar = vi.mocked(atualizarGrandeza)
const excluir = vi.mocked(excluirGrandeza)

const RADIACAO: Grandeza = {
  id: 'g-1', nome: 'Radiação Solar', unidade: 'W/m²', faixa_min: '0.00', faixa_max: '1500.00', agregacao: 'media',
}
const DIRECAO: Grandeza = {
  id: 'g-2', nome: 'Direção do Vento', unidade: '°', faixa_min: '0.00', faixa_max: '360.00', agregacao: 'media_circular',
}

const erroDaApi = (status: number, message: string) =>
  new AxiosError('falhou', AxiosError.ERR_BAD_REQUEST, undefined, undefined, {
    status, data: { message },
  } as AxiosResponse)

function abrir(papeis: string[] = ['grandezas.view', 'grandezas.manage']) {
  permissoes.concedidas = papeis
  render(<Grandezas />)
  return screen.findByRole('table', { name: /grandezas cadastradas/i })
}

function preencherNovo({ nome = 'Radiação Solar', unidade = 'W/m²', min = '0', max = '1500' } = {}) {
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: nome } })
  fireEvent.change(screen.getByLabelText('Unidade de medida'), { target: { value: unidade } })
  fireEvent.change(screen.getByLabelText('Faixa mínima'), { target: { value: min } })
  fireEvent.change(screen.getByLabelText('Faixa máxima'), { target: { value: max } })
}

function enviar() {
  fireEvent.submit(screen.getByRole('button', { name: /^salvar$/i }).closest('form') as HTMLFormElement)
}

beforeEach(() => {
  vi.resetAllMocks()
  listar.mockResolvedValue([RADIACAO, DIRECAO])
})

describe('Grandezas: lista e perfis (US-39)', () => {
  it('mostra as grandezas do catálogo com faixa e agregação em português', async () => {
    const tabela = await abrir()

    const linhas = within(tabela).getAllByRole('row').slice(1)
    expect(linhas[0]).toHaveTextContent('Radiação Solar')
    expect(linhas[0]).toHaveTextContent('W/m²')
    expect(linhas[0]).toHaveTextContent('0,00')
    expect(linhas[1]).toHaveTextContent('Média circular')
  })

  it('o Administrador vê os botões de criar, editar e excluir', async () => {
    await abrir(['grandezas.view', 'grandezas.manage'])

    expect(screen.getByRole('button', { name: /nova grandeza/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /editar radiação solar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /excluir radiação solar/i })).toBeInTheDocument()
  })

  it('quem só consulta vê a lista, sem nenhum botão de ação', async () => {
    await abrir(['grandezas.view'])

    expect(screen.queryByRole('button', { name: /nova grandeza/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument()
    expect(screen.getByText('Radiação Solar')).toBeInTheDocument()
  })

  it('avisa quando a lista não carrega e busca de novo ao tentar', async () => {
    listar.mockRejectedValueOnce(new Error('rede'))
    permissoes.concedidas = ['grandezas.view']
    render(<Grandezas />)

    expect(await screen.findByRole('alert')).toHaveTextContent(/não foi possível carregar as grandezas/i)

    fireEvent.click(screen.getByRole('button', { name: /tentar de novo/i }))

    expect(await screen.findByText('Radiação Solar')).toBeInTheDocument()
    expect(listar).toHaveBeenCalledTimes(2)
  })
})

describe('Grandezas: cadastrar (US-39, Cenário 1)', () => {
  it('cria a grandeza com os números convertidos e atualiza a lista', async () => {
    await abrir()
    criar.mockResolvedValueOnce({ ...RADIACAO, id: 'g-9' })

    fireEvent.click(screen.getByRole('button', { name: /nova grandeza/i }))
    preencherNovo()
    enviar()

    await waitFor(() => expect(criar).toHaveBeenCalledTimes(1))
    expect(criar).toHaveBeenCalledWith({
      nome: 'Radiação Solar', unidade: 'W/m²', faixa_min: 0, faixa_max: 1500, agregacao: 'media',
    })
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2))
  })

  it('não envia quando a faixa mínima não é menor que a máxima', async () => {
    await abrir()

    fireEvent.click(screen.getByRole('button', { name: /nova grandeza/i }))
    preencherNovo({ min: '1500', max: '0' })
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent(/faixa mínima precisa ser menor/i)
    expect(criar).not.toHaveBeenCalled()
  })

  it('não envia com mais de 2 casas decimais na faixa', async () => {
    await abrir()

    fireEvent.click(screen.getByRole('button', { name: /nova grandeza/i }))
    preencherNovo({ min: '0', max: '1.234' })
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent(/no máximo 2 casas decimais/i)
    expect(criar).not.toHaveBeenCalled()
  })

  it('mostra a mensagem da API quando o nome já existe (409)', async () => {
    await abrir()
    criar.mockRejectedValueOnce(erroDaApi(409, 'Já existe uma grandeza com o nome "Radiação Solar" no catálogo.'))

    fireEvent.click(screen.getByRole('button', { name: /nova grandeza/i }))
    preencherNovo()
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma grandeza com o nome "Radiação Solar"')
  })
})

describe('Grandezas: alterar (US-39, Cenário 7)', () => {
  it('não deixa trocar o nome e envia só unidade, faixa e agregação', async () => {
    await abrir()
    atualizar.mockResolvedValueOnce({ ...RADIACAO, faixa_max: '800.00' })

    fireEvent.click(screen.getByRole('button', { name: /editar radiação solar/i }))
    expect(screen.getByLabelText('Nome')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Faixa máxima'), { target: { value: '800' } })
    enviar()

    await waitFor(() => expect(atualizar).toHaveBeenCalledTimes(1))
    expect(atualizar).toHaveBeenCalledWith('g-1', {
      unidade: 'W/m²', faixa_min: 0, faixa_max: 800, agregacao: 'media',
    })
  })

  it('mostra a mensagem da API quando a unidade não pode mudar porque a grandeza está em uso (409)', async () => {
    await abrir()
    atualizar.mockRejectedValueOnce(erroDaApi(409, 'A unidade não pode ser alterada: esta grandeza já é usada por sensores.'))

    fireEvent.click(screen.getByRole('button', { name: /editar radiação solar/i }))
    fireEvent.change(screen.getByLabelText('Unidade de medida'), { target: { value: 'kW/m²' } })
    enviar()

    expect(await screen.findByRole('alert')).toHaveTextContent(/a unidade não pode ser alterada/i)
  })
})

describe('Grandezas: excluir (US-39, Cenário 8)', () => {
  it('exclui a grandeza depois de confirmar', async () => {
    await abrir()
    excluir.mockResolvedValueOnce(undefined)

    fireEvent.click(screen.getByRole('button', { name: /excluir radiação solar/i }))
    fireEvent.click(screen.getByRole('button', { name: /^excluir$/i }))

    await waitFor(() => expect(excluir).toHaveBeenCalledWith('g-1'))
  })

  it('mostra a mensagem 409 e não tira a grandeza da lista quando ela está em uso', async () => {
    await abrir()
    excluir.mockRejectedValueOnce(erroDaApi(409, 'Esta grandeza é usada por 2 sensores e não pode ser excluída.'))

    fireEvent.click(screen.getByRole('button', { name: /excluir radiação solar/i }))
    fireEvent.click(screen.getByRole('button', { name: /^excluir$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('não pode ser excluída')
    expect(screen.getByText('Radiação Solar')).toBeInTheDocument()
  })
})
