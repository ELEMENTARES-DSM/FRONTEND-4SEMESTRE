import api from '../api/instance'

export interface Usuario {
    id: string
    nome: string
    email: string
    papel_id: string
    papel_nome: string
    municipio: string | null
    esta_ativo: boolean
    criado_em?: string
    atualizado_em?: string
    ultimo_acesso?: string
}

export interface Papel {
    id: string
    nome: string
    descricao: string
    criado_em?: string
}

// Contrato do backend (services/gestao-usuarios/src/validations/user.validation.ts)
export interface NovoUsuario {
    nome: string
    email: string
    senha: string
    papel_id: string
    municipio?: string
}

export type DadosUsuario = Partial<Omit<NovoUsuario, 'senha'>>

// GET /usuarios/ - tabela da Gestão de Usuários
export async function listarUsuarios(): Promise<Usuario[]> {
    const response = await api.get<Usuario[]>('/usuarios/')
    return response.data
}

// GET /usuarios/papeis/ - select de papel (id como valor, nome como label)
export async function listarPapeis(): Promise<Papel[]> {
    const response = await api.get<Papel[]>('/usuarios/papeis/')
    return response.data
}

// GET /usuarios/:id - dados atualizados ao abrir a edição.
// A API atual responde uma lista com o usuário; aceita também um objeto.
export async function buscarUsuario(id: string): Promise<Usuario> {
    const response = await api.get<Usuario | Usuario[]>(`/usuarios/${id}`)
    const usuario = Array.isArray(response.data) ? response.data[0] : response.data
    if (!usuario) throw new Error('Usuário não encontrado.')
    return usuario
}

// POST /usuarios/ - cadastro (a resposta não traz papel_nome)
export async function criarUsuario(dados: NovoUsuario): Promise<Omit<Usuario, 'papel_nome'>> {
    const response = await api.post<Omit<Usuario, 'papel_nome'>>('/usuarios/', dados)
    return response.data
}

// PUT /usuarios/:id - edição (a resposta não traz papel_nome)
export async function atualizarUsuario(id: string, dados: DadosUsuario): Promise<Omit<Usuario, 'papel_nome'>> {
    const response = await api.put<Omit<Usuario, 'papel_nome'>>(`/usuarios/${id}`, dados)
    return response.data
}

// PATCH /usuarios/:id/status - ativar/desativar
export async function alterarStatusUsuario(id: string, esta_ativo: boolean): Promise<void> {
    await api.patch(`/usuarios/${id}/status`, { esta_ativo })
}

// DELETE /usuarios/:id - exclusão
export async function excluirUsuario(id: string): Promise<void> {
    await api.delete(`/usuarios/${id}`)
}
