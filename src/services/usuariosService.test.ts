import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  alterarStatusUsuario,
  atualizarUsuario,
  buscarUsuario,
  criarUsuario,
  excluirUsuario,
  listarPapeis,
  listarUsuarios,
} from './usuariosService'

const http = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../api/instance', () => ({ default: http }))

const usuario = {
  id: 'u-1', nome: 'Ana', email: 'ana@exemplo.com', papel_id: 'p-1',
  papel_nome: 'ADMINISTRADOR', municipio: null, esta_ativo: true,
}

beforeEach(() => vi.resetAllMocks())

describe('usuariosService', () => {
  it('lista usuários e papéis nas rotas corretas e devolve os dados recebidos', async () => {
    const papeis = [{ id: 'p-1', nome: 'ADMINISTRADOR', descricao: 'Gestão global' }]
    http.get.mockResolvedValueOnce({ data: [usuario] }).mockResolvedValueOnce({ data: papeis })

    await expect(listarUsuarios()).resolves.toEqual([usuario])
    await expect(listarPapeis()).resolves.toEqual(papeis)
    expect(http.get).toHaveBeenNthCalledWith(1, '/usuarios/')
    expect(http.get).toHaveBeenNthCalledWith(2, '/usuarios/papeis/')
  })

  it('busca um usuário tanto na resposta em lista quanto na resposta em objeto', async () => {
    http.get.mockResolvedValueOnce({ data: [usuario] }).mockResolvedValueOnce({ data: usuario })

    await expect(buscarUsuario('u-1')).resolves.toEqual(usuario)
    await expect(buscarUsuario('u-1')).resolves.toEqual(usuario)
    expect(http.get).toHaveBeenCalledTimes(2)
    expect(http.get).toHaveBeenCalledWith('/usuarios/u-1')
  })

  it('informa quando a busca por ID retorna uma lista vazia', async () => {
    http.get.mockResolvedValue({ data: [] })

    await expect(buscarUsuario('u-404')).rejects.toThrow('Usuário não encontrado.')
  })

  it('envia o cadastro completo e devolve o usuário criado', async () => {
    const dados = { nome: 'Ana', email: 'ana@exemplo.com', senha: 'senha-segura', papel_id: 'p-1' }
    const criado = { id: 'u-1', nome: dados.nome, email: dados.email, papel_id: dados.papel_id, municipio: null, esta_ativo: true }
    http.post.mockResolvedValue({ data: criado })

    await expect(criarUsuario(dados)).resolves.toEqual(criado)
    expect(http.post).toHaveBeenCalledWith('/usuarios/', dados)
  })

  it('envia só as alterações na edição, sem senha', async () => {
    const alteracoes = { nome: 'Ana Maria', municipio: 'São Paulo' }
    const atualizado = { ...usuario, ...alteracoes }
    http.put.mockResolvedValue({ data: atualizado })

    await expect(atualizarUsuario('u-1', alteracoes)).resolves.toEqual(atualizado)
    expect(http.put).toHaveBeenCalledWith('/usuarios/u-1', alteracoes)
    expect(http.put.mock.calls[0][1]).not.toHaveProperty('senha')
  })

  it('envia o booleano correto para ativar e desativar', async () => {
    http.patch.mockResolvedValue({ data: {} })

    await alterarStatusUsuario('u-1', false)
    await alterarStatusUsuario('u-1', true)
    expect(http.patch).toHaveBeenNthCalledWith(1, '/usuarios/u-1/status', { esta_ativo: false })
    expect(http.patch).toHaveBeenNthCalledWith(2, '/usuarios/u-1/status', { esta_ativo: true })
  })

  it('exclui pelo ID e propaga uma falha da API', async () => {
    http.delete.mockResolvedValueOnce({ data: undefined }).mockRejectedValueOnce(new Error('Falha na API'))

    await expect(excluirUsuario('u-1')).resolves.toBeUndefined()
    expect(http.delete).toHaveBeenCalledWith('/usuarios/u-1')
    await expect(excluirUsuario('u-2')).rejects.toThrow('Falha na API')
  })
})
