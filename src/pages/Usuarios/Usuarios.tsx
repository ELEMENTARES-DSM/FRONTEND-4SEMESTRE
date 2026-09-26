import { useCallback, useEffect, useState } from 'react'

import axios from 'axios'
import { Link } from 'react-router-dom'

import { UsuarioForm } from '../../components/UsuarioForm/UsuarioForm'
import { UsuarioFilters, type FiltrosUsuarios } from '../../components/UsuarioFilters/UsuarioFilters'
import { mockPapeis, mockUsuarios } from '../../mocks/usuariosMock'
import {
  alterarStatusUsuario,
  atualizarUsuario,
  buscarUsuario,
  criarUsuario,
  excluirUsuario,
  listarPapeis,
  listarUsuarios,
  type NovoUsuario,
  type Papel,
  type Usuario,
} from '../../services/usuariosService'
import { Button } from '../../shared/components/Button'
import { Icon } from '../../shared/components/Icon'
import { Modal } from '../../shared/components/Modal'
import { Pagination } from '../../shared/components/Pagination'
import { Table, type TableColumn } from '../../shared/components/Table'
import { Toast, type Notificacao } from '../../shared/components/Toast'
import { Toggle } from '../../shared/components/Toggle'

type Dialogo =
  | { tipo: 'novo' }
  | { tipo: 'editar'; usuario: Usuario }
  | { tipo: 'excluir'; usuario: Usuario }
  | null

// Sem resposta (rede/proxy) ou erro 5xx do gateway: backend fora do ar.
function backendIndisponivel(error: unknown) {
  return (
    axios.isAxiosError(error) &&
    (!error.response || error.response.status >= 500)
  )
}

// O backend responde { message } nos erros tratados
// (409 e-mail duplicado, 403, 404...).
function mensagemErro(error: unknown, padrao: string) {
  const message = axios.isAxiosError(error)
    ? error.response?.data?.message
    : undefined

  return typeof message === 'string' ? message : padrao
}

export function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [papeis, setPapeis] = useState<Papel[]>([])

  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [usandoMock, setUsandoMock] = useState(false)

  const [filtros, setFiltros] = useState<FiltrosUsuarios>({ busca: '', papel: '', municipio: '', status: '' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [erroDialogo, setErroDialogo] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [busyId, setBusyId] = useState<string | null>(null)

  const [notification, setNotification] =
    useState<Notificacao | null>(null)

  const fecharNotificacao = useCallback(() => {
    setNotification(null)
  }, [])

  function notificar(type: Notificacao['type'], message: string) {
    setNotification({
      id: Date.now(),
      type,
      message,
    })
  }

  function abrirDialogo(novo: Dialogo) {
    setErroDialogo('')
    setDialogo(novo)
  }

  // GET /usuarios/ + GET /usuarios/papeis/
  useEffect(() => {
    let ativo = true

    async function carregar() {
      // Usa o mesmo modo de demonstração já configurado no frontend.
      // O adaptador HTTP atual não possui rotas de usuários.
      if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
        if (ativo) {
          setUsuarios(mockUsuarios)
          setPapeis(mockPapeis)
          setUsandoMock(true)
          setLoading(false)
        }
        return
      }

      try {
        const [dadosUsuarios, dadosPapeis] = await Promise.all([
          listarUsuarios(),
          listarPapeis(),
        ])

        if (ativo) {
          setUsuarios(dadosUsuarios)
          setPapeis(dadosPapeis)
        }
      } catch (error) {
        if (!ativo) return

        // 401 já é tratado pelo interceptor (volta ao login).
        // Mocks só em desenvolvimento.
        if (import.meta.env.DEV && backendIndisponivel(error)) {
          setUsuarios(mockUsuarios)
          setPapeis(mockPapeis)
          setUsandoMock(true)
        } else {
          setErro(
            mensagemErro(
              error,
              'Não foi possível carregar os usuários. Confira a conexão com a API.',
            ),
          )
        }
      } finally {
        if (ativo) {
          setLoading(false)
        }
      }
    }

    carregar()

    return () => {
      ativo = false
    }
  }, [])

  // PATCH /usuarios/:id/status — só atualiza a tela depois do sucesso.
  async function alternarStatus(usuario: Usuario) {
    const esta_ativo = !usuario.esta_ativo

    setBusyId(usuario.id)

    try {
      if (!usandoMock) {
        await alterarStatusUsuario(usuario.id, esta_ativo)
      }

      setUsuarios((atual) =>
        atual.map((u) =>
          u.id === usuario.id
            ? { ...u, esta_ativo }
            : u,
        ),
      )

      notificar(
        'success',
        `${usuario.nome} foi ${
          esta_ativo ? 'ativado' : 'desativado'
        }.`,
      )
    } catch (error) {
      notificar(
        'error',
        mensagemErro(
          error,
          'Não foi possível alterar o status do usuário.',
        ),
      )
    } finally {
      setBusyId(null)
    }
  }

  // GET /usuarios/:id — abre a edição com os dados atuais do backend.
  async function abrirEdicao(usuario: Usuario) {
    if (usandoMock) {
      return abrirDialogo({
        tipo: 'editar',
        usuario,
      })
    }

    setBusyId(usuario.id)

    try {
      const atual = await buscarUsuario(usuario.id)

      abrirDialogo({
        tipo: 'editar',
        usuario: {
          ...usuario,
          ...atual,
        },
      })
    } catch (error) {
      notificar(
        'error',
        mensagemErro(
          error,
          'Não foi possível carregar os dados do usuário.',
        ),
      )
    } finally {
      setBusyId(null)
    }
  }

  // POST /usuarios/ (novo) ou PUT /usuarios/:id (edição)
  async function salvar(dados: NovoUsuario) {
    const papel_nome =
      papeis.find((papel) => papel.id === dados.papel_id)?.nome ?? ''

    setErroDialogo('')
    setSalvando(true)

    try {
      if (dialogo?.tipo === 'editar') {
        const { usuario } = dialogo

        const alteracoes = {
          nome: dados.nome,
          email: dados.email,
          papel_id: dados.papel_id,
          municipio: dados.municipio,
        }

        const salvo = usandoMock
          ? {
              ...usuario,
              ...alteracoes,
              municipio:
                dados.municipio ?? usuario.municipio,
            }
          : await atualizarUsuario(usuario.id, alteracoes)

        setUsuarios((atual) =>
          atual.map((u) =>
            u.id === usuario.id
              ? {
                  ...u,
                  ...salvo,
                  papel_nome,
                }
              : u,
          ),
        )

        notificar(
          'success',
          `${dados.nome} foi atualizado.`,
        )
      } else {
        const salvo = usandoMock
          ? {
              id: `mock-${Date.now()}`,
              nome: dados.nome,
              email: dados.email,
              papel_id: dados.papel_id,
              municipio: dados.municipio ?? null,
              esta_ativo: true,
            }
          : await criarUsuario(dados)

        setUsuarios((atual) => [
          {
            ...salvo,
            papel_nome,
          },
          ...atual,
        ])

        notificar(
          'success',
          `${dados.nome} foi cadastrado.`,
        )
      }

      setDialogo(null)
    } catch (error) {
      setErroDialogo(
        mensagemErro(
          error,
          'Não foi possível salvar o usuário.',
        ),
      )
    } finally {
      setSalvando(false)
    }
  }

  // DELETE /usuarios/:id
  async function excluir(usuario: Usuario) {
    setErroDialogo('')
    setSalvando(true)

    try {
      if (!usandoMock) {
        await excluirUsuario(usuario.id)
      }

      setUsuarios((atual) =>
        atual.filter((u) => u.id !== usuario.id),
      )

      setDialogo(null)

      notificar(
        'success',
        `${usuario.nome} foi excluído.`,
      )
    } catch (error) {
      setErroDialogo(
        mensagemErro(
          error,
          'Não foi possível excluir o usuário.',
        ),
      )
    } finally {
      setSalvando(false)
    }
  }

  const termo = filtros.busca.trim().toLocaleLowerCase('pt-BR')

  const municipios = [...new Set(usuarios.flatMap((u) => u.municipio ? [u.municipio] : []))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))

  const filtrados = usuarios.filter(
    (u) =>
      (!termo || `${u.nome} ${u.email}`.toLocaleLowerCase('pt-BR').includes(termo)) &&
      (!filtros.papel || u.papel_nome === filtros.papel) &&
      (!filtros.municipio || (filtros.municipio === '__nenhum' ? !u.municipio : u.municipio === filtros.municipio)) &&
      (!filtros.status || u.esta_ativo === (filtros.status === 'ativo')),
  )

  const paginaAtual = Math.min(
    page,
    Math.max(1, Math.ceil(filtrados.length / pageSize)),
  )

  const visiveis = filtrados.slice(
    (paginaAtual - 1) * pageSize,
    paginaAtual * pageSize,
  )

  const coresPapel: Record<string, string> = {
    ADMINISTRADOR: 'border-primary/35 bg-primary/15 text-primary',
    GESTOR_PUBLICO: 'border-secondary/35 bg-secondary/15 text-secondary',
    PESQUISADOR: 'border-accent/35 bg-accent/15 text-accent',
  }

  function papelVisual(nome: string) {
    return (
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide ${coresPapel[nome] ?? 'border-line bg-base-300 text-muted'}`}>
        {nome.replaceAll('_', ' ')}
      </span>
    )
  }

  function statusVisual(ativo: boolean) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${ativo ? 'text-success' : 'text-muted'}`}>
        <span className={`size-[7px] rounded-full ${ativo ? 'animate-dot bg-success' : 'bg-muted'}`} />
        {ativo ? 'Ativo' : 'Inativo'}
      </span>
    )
  }

  const colunas: TableColumn<Usuario>[] = [
    {
      key: 'nome',
      header: 'Nome',
      className: 'relative font-medium before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:scale-y-0 before:bg-primary before:shadow-[0_0_14px_3px_#00A6E688] before:transition-transform group-hover:before:scale-y-100 group-focus:before:scale-y-100',
    },

    {
      key: 'email',
      header: 'E-mail',
      className: 'font-mono text-[13px] text-muted',
    },

    {
      key: 'papel_nome',
      header: 'Papel',
      render: (u) => papelVisual(u.papel_nome),
    },

    {
      key: 'municipio',
      header: 'Município',
      render: (u) =>
        u.municipio ?? (
          <span className="text-muted">
            Não se aplica
          </span>
        ),
    },

    {
      key: 'esta_ativo',
      header: 'Status',
      render: (u) => (
        <div className="flex items-center gap-3">
          {statusVisual(u.esta_ativo)}
          <Toggle
            checked={u.esta_ativo}
            busy={busyId === u.id}
            label={`${
              u.esta_ativo ? 'Desativar' : 'Ativar'
            } ${u.nome}`}
            onChange={() => void alternarStatus(u)}
          />

        </div>
      ),
    },

    {
      key: 'acoes',
      header: 'Ações',
      align: 'right',
      render: (u) => (
        <div className="flex justify-end">
          <Button
            variant="danger"
            disabled={busyId === u.id}
            onClick={() =>
              abrirDialogo({
                tipo: 'excluir',
                usuario: u,
              })
            }
            aria-label={`Excluir ${u.nome}`}
          >
            <Icon name="trash" size={14} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <main className="mx-auto min-h-dvh max-w-[1200px] px-4 py-6 sm:px-8 sm:py-9">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/platform" className="mb-3 inline-flex items-center gap-1 text-[13px] text-muted transition hover:text-primary">
            <Icon name="left" size={14} /> Voltar à plataforma
          </Link>
          <h1 className="text-xl font-bold tracking-[-0.02em] sm:text-[26px]">Gestão de Usuários</h1>
          <p className="mt-1 text-[13px] text-muted sm:text-sm">Visualize, busque e controle o acesso dos usuários.</p>
        </div>
        <Button
          variant="primary"
          className="shrink-0 rounded-lg px-4 py-2.5 text-sm"
          disabled={loading || !!erro}
          onClick={() => abrirDialogo({ tipo: 'novo' })}
        >
          <Icon name="plus" size={16} /> Novo usuário
        </Button>
      </header>

      {usandoMock && (
        <p
          role="status"
          className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
        >
          Exibindo dados de exemplo de usuários fictícios.
          As alterações valem só nesta tela.
        </p>
      )}

      {erro && (
        <p
          role="alert"
          className="mb-4 text-sm text-error"
        >
          {erro}
        </p>
      )}

      <UsuarioFilters filtros={filtros} papeis={papeis} municipios={municipios}
        onChange={(value) => { setFiltros(value); setPage(1) }}
        onClear={() => { setFiltros({ busca: '', papel: '', municipio: '', status: '' }); setPage(1) }} />

      {!loading && !erro && (
        <p aria-live="polite" className="mb-2.5 text-[13px] text-muted">
          <strong className="font-semibold text-base-content">{filtrados.length}</strong>{' '}
          usuário{filtrados.length === 1 ? '' : 's'} encontrado{filtrados.length === 1 ? '' : 's'}
        </p>
      )}

      <section aria-label="Lista de usuários" aria-busy={loading} className="overflow-hidden rounded-[10px] border border-line bg-base-200">
        <Table
          columns={colunas}
          data={visiveis}
          loading={loading}
          onRowClick={(u) => { if (busyId !== u.id) void abrirEdicao(u) }}
          containerClassName="hidden rounded-none border-0 bg-transparent shadow-none sm:block"
          emptyMessage={erro ? 'Não foi possível carregar os usuários.' : 'Nenhum usuário encontrado.'}
        />
        <div className="flex flex-col gap-2.5 p-3 sm:hidden">
          {loading && <p className="py-8 text-center text-sm text-muted">Carregando usuários...</p>}
          {!loading && visiveis.length === 0 && (
            <p className="py-8 text-center text-sm text-muted">{erro ? 'Não foi possível carregar os usuários.' : 'Nenhum usuário encontrado.'}</p>
          )}
          {!loading && visiveis.map((u) => (
            <article key={u.id} className="group relative rounded-[10px] border border-line bg-base-300/50 p-4 transition hover:border-primary/50 hover:bg-row-hover focus-within:border-primary">
              <button type="button" disabled={busyId === u.id} aria-label={`Editar ${u.nome}`}
                onClick={() => void abrirEdicao(u)}
                className="absolute inset-0 z-0 rounded-[10px] focus-visible:outline-2 focus-visible:outline-primary" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[3px] scale-y-0 bg-primary shadow-[0_0_14px_3px_#00A6E688] transition-transform group-hover:scale-y-100 group-focus-within:scale-y-100" />
              <div className="pointer-events-none relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{u.nome}</p>
                  <p className="truncate font-mono text-xs text-muted">{u.email}</p>
                </div>
                <div className="pointer-events-auto relative z-20"><Toggle checked={u.esta_ativo} busy={busyId === u.id} label={`${u.esta_ativo ? 'Desativar' : 'Ativar'} ${u.nome}`} onChange={() => void alternarStatus(u)} /></div>
              </div>
              <div className="pointer-events-none relative z-10 mt-3 flex flex-wrap items-center gap-2">{papelVisual(u.papel_nome)}{statusVisual(u.esta_ativo)}</div>
              <p className="pointer-events-none relative z-10 mt-3 text-xs text-muted">Município: <span className="text-base-content">{u.municipio ?? 'Não se aplica'}</span>
              </p>
              <div className="pointer-events-none relative z-10 mt-4 flex justify-end border-t border-line pt-3">
                <div className="pointer-events-auto relative z-20">
                <Button variant="danger" disabled={busyId === u.id} onClick={() => abrirDialogo({ tipo: 'excluir', usuario: u })} aria-label={`Excluir ${u.nome}`}>
                  <Icon name="trash" size={14} />
                </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {filtrados.length > 0 && (
          <Pagination page={paginaAtual} pageSize={pageSize} total={filtrados.length} onPage={setPage}
            onPageSize={(tamanho) => { setPageSize(tamanho); setPage(1) }} />
        )}
      </section>

      {(dialogo?.tipo === 'novo' ||
        dialogo?.tipo === 'editar') && (
        <UsuarioForm
          usuario={
            dialogo.tipo === 'editar'
              ? dialogo.usuario
              : undefined
          }
          papeis={papeis}
          busy={salvando}
          error={erroDialogo}
          onClose={() => setDialogo(null)}
          onSave={(dados) => void salvar(dados)}
        />
      )}

      {dialogo?.tipo === 'excluir' && (
        <Modal
          compact
          title="Excluir usuário?"
          onClose={() => setDialogo(null)}
          busy={salvando}
        >
          <p className="mt-2 text-[13px] text-muted">
            O usuário abaixo perderá o acesso à
            plataforma:
          </p>

          <p className="mt-1.5 text-[13px] font-semibold">
            {dialogo.usuario.nome}
          </p>

          <p className="mb-5 font-mono text-xs text-muted">
            {dialogo.usuario.email}
          </p>

          {erroDialogo && (
            <p
              role="alert"
              className="mb-3 text-xs text-error"
            >
              {erroDialogo}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setDialogo(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>

            <Button
              variant="danger"
              busy={salvando}
              onClick={() =>
                void excluir(dialogo.usuario)
              }
            >
              Confirmar exclusão
            </Button>
          </div>
        </Modal>
      )}

      <Toast
        notification={notification}
        onClose={fecharNotificacao}
      />
    </main>
  )
}
