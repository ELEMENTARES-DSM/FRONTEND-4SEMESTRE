import { useState, useMemo, useCallback } from 'react'
import { Button } from '../shared/components/Button'
import { Filter, type FilterOption } from '../shared/components/Filter'
import { Icon } from '../shared/components/Icon'
import { Loading } from '../shared/components/Loading'
import { Modal } from '../shared/components/Modal'
import { Pagination } from '../shared/components/Pagination'
import { SearchInput } from '../shared/components/SearchInput'
import { Table, type TableColumn } from '../shared/components/Table'
import { Toast, type Notificacao } from '../shared/components/Toast'
import { Toggle } from '../shared/components/Toggle'
import { Input } from '../shared/components/Field'
import { useStations } from '../hooks/useStations'
import { useAuthorization } from '../auth/useAuthorization'
import {
  StationConflictError,
  StationForbiddenError,
} from '../services/stations/stations.errors'
import type {
  Station,
  StationStatus,
  FilterStatus,
  StationCoordinates,
  StationsProps,
} from '../types/stations'

export type {
  Station,
  StationStatus,
  FilterStatus,
  StationCoordinates,
  StationsProps,
}

export function StatusBadge({ status }: { status: StationStatus }) {
  const configs: Record<
    StationStatus,
    { badgeClass: string; dotClass: string; label: string }
  > = {
    Ativa: {
      badgeClass: 'bg-success/15 text-success border-success/30',
      dotClass: 'bg-success',
      label: 'Ativa',
    },
    Inativa: {
      badgeClass: 'bg-neutral/40 text-muted border-line',
      dotClass: 'bg-muted/70',
      label: 'Inativa',
    },
    'Com Falha': {
      badgeClass: 'bg-warning/15 text-warning border-warning/30',
      dotClass: 'bg-warning',
      label: 'Com Falha',
    },
  }

  const current = configs[status] ?? {
    badgeClass: 'bg-base-300 text-muted border-line',
    dotClass: 'bg-muted',
    label: status,
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${current.badgeClass}`}
    >
      <span className={`size-1.5 rounded-full shrink-0 ${current.dotClass}`} />
      {current.label}
    </span>
  )
}

function formatDateTime(value?: string | Date | null): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`

function getCoordinateValue(value: unknown): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

export function BatteryBadge({ level }: { level?: number | null }) {
  if (level === null || level === undefined) {
    return <span className="text-muted text-xs font-mono">—</span>
  }

  let colorClass = 'text-success'
  let bgClass = 'bg-success/15 border-success/30'

  if (level <= 20) {
    colorClass = 'text-error'
    bgClass = 'bg-error/15 border-error/30'
  } else if (level <= 50) {
    colorClass = 'text-warning'
    bgClass = 'bg-warning/15 border-warning/30'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded border ${bgClass} ${colorClass}`}
    >
      {level}%
    </span>
  )
}

export function Stations({ initialStations }: StationsProps = {}) {
  const { usuario, hasRole, canViewStations, canCreateStation, canToggleStation } =
    useAuthorization()
  const isAdmin = hasRole('ADMINISTRADOR')

  const {
    stations,
    loading,
    error,
    togglingId,
    refresh,
    createStation,
    toggleStationStatus,
  } = useStations({ initialStations, autoFetch: canViewStations })

  const [notification, setNotification] = useState<Notificacao | null>(null)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('Todas')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [isNewStationModalOpen, setIsNewStationModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)

  const [formCodigo, setFormCodigo] = useState('')
  const [formNome, setFormNome] = useState('')
  const [formMunicipio, setFormMunicipio] = useState('')
  const [formLat, setFormLat] = useState('')
  const [formLon, setFormLon] = useState('')

  const notify = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({
        id: Date.now(),
        message,
        type,
      })
    },
    [],
  )

  const handleRefresh = useCallback(async () => {
    try {
      await refresh()
      notify('Dados de estações atualizados.', 'success')
    } catch (error) {
      if (error instanceof StationForbiddenError) {
        notify(error.message, 'error')
      } else {
        notify('Falha ao sincronizar com a fonte de dados.', 'error')
      }
      console.error(error)
    }
  }, [refresh, notify])

  const counts = useMemo(() => {
    const count = (status: StationStatus) => stations.filter((s) => s.status === status).length

    return {
      total: stations.length,
      ativas: count('Ativa'),
      inativas: count('Inativa'),
      comFalha: count('Com Falha'),
    }
  }, [stations])

  const filterOptions: FilterOption<FilterStatus>[] = useMemo(
    () => [
      { label: 'Todas', value: 'Todas', count: counts.total },
      { label: 'Ativas', value: 'Ativas', count: counts.ativas },
      { label: 'Inativas', value: 'Inativas', count: counts.inativas },
      { label: 'Com Falha', value: 'Com Falha', count: counts.comFalha },
    ],
    [counts],
  )

  const filteredStations = useMemo(() => {
    const statusDoFiltro: Record<FilterStatus, StationStatus | null> = {
      Todas: null,
      Ativas: 'Ativa',
      Inativas: 'Inativa',
      'Com Falha': 'Com Falha',
    }
    const alvo = statusDoFiltro[statusFilter]

    return stations.filter((station) => {
      if (alvo && station.status !== alvo) return false

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchCodigo = station.codigo.toLowerCase().includes(query)
        const matchNome = station.nome.toLowerCase().includes(query)
        if (!matchCodigo && !matchNome) return false
      }

      return true
    })
  }, [stations, statusFilter, searchQuery])

  const paginatedStations = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredStations.slice(startIndex, startIndex + pageSize)
  }, [filteredStations, currentPage, pageSize])

  const totalFiltered = filteredStations.length

  const handleToggleStatus = useCallback(
    async (stationId: string) => {
      if (!canToggleStation) {
        notify('Acesso negado. Perfil insuficiente para esta ação.', 'error')
        return
      }

      const station = stations.find((s) => s.id === stationId)
      if (!station) return

      const nextAtivo = !station.ativo

      try {
        await toggleStationStatus(stationId)
        notify(
          `Estação ${station.codigo} ${nextAtivo ? 'ativada' : 'desativada'} com sucesso!`,
          'success',
        )
      } catch (error) {
        if (error instanceof StationForbiddenError) {
          notify(error.message, 'error')
        } else {
          notify(`Erro ao alterar o status da estação ${station.codigo}.`, 'error')
        }
        console.error(error)
      }
    },
    [stations, toggleStationStatus, notify, canToggleStation],
  )

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canCreateStation) {
      notify('Acesso negado. Perfil insuficiente para esta ação.', 'error')
      return
    }

    if (!formCodigo.trim() || !formNome.trim()) {
      notify('Por favor, preencha todos os campos obrigatórios.', 'error')
      return
    }

    const latitude = parseFloat(formLat)
    const longitude = parseFloat(formLon)

    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      notify('Coordenadas geográficas fora dos limites válidos', 'error')
      return
    }

    // ADMINISTRADOR não tem município no JWT e informa o da estação;
    // GESTOR_PUBLICO não envia: o back usa o município do token (US-03).
    const municipioAdmin = formMunicipio.trim()
    if (isAdmin && !municipioAdmin) {
      notify('Informe o município da estação.', 'error')
      return
    }
    if (!isAdmin && !usuario?.municipio?.trim()) {
      notify('Município do usuário não identificado para vincular à estação.', 'error')
      return
    }

    setIsSubmitting(true)

    try {
      const normalizedCodigo = formCodigo.trim().toUpperCase()

      await createStation({
        codigo: normalizedCodigo,
        nome: formNome.trim(),
        latitude,
        longitude,
        ...(isAdmin ? { municipio: municipioAdmin } : {}),
      })

      notify('Estação meteorológica cadastrada com sucesso', 'success')

      setFormCodigo('')
      setFormNome('')
      setFormMunicipio('')
      setFormLat('')
      setFormLon('')
      setIsNewStationModalOpen(false)
    } catch (error: unknown) {
      if (error instanceof StationConflictError) {
        notify('Identificador de estação já cadastrado no sistema', 'error')
      } else if (error instanceof StationForbiddenError) {
        notify(error.message, 'error')
      } else {
        notify('Erro ao cadastrar nova estação.', 'error')
        console.error(error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: TableColumn<Station>[] = useMemo(() => {
    const baseColumns: TableColumn<Station>[] = [
      {
        key: 'codigo',
        header: 'Código',
        sortable: true,
        width: '140px',
        render: (item) => (
          <button
            type="button"
            onClick={() => setSelectedStation(item)}
            className="font-mono font-bold text-primary hover:underline hover:text-primary/80 transition-colors text-left focus:outline-none"
            title={`Ver detalhes de ${item.codigo}`}
          >
            {item.codigo}
          </button>
        ),
      },
      {
        key: 'nome',
        header: 'Nome da Localidade',
        sortable: true,
        render: (item) => (
          <span className="font-medium text-base-content">{item.nome}</span>
        ),
      },
      {
        key: 'coordenadas',
        header: 'Coordenadas (Lat/Lon)',
        sortable: false,
        width: '170px',
        render: (item) => {
          const latitude = getCoordinateValue(item.latitude ?? item.coordenadas?.latitude)
          const longitude = getCoordinateValue(item.longitude ?? item.coordenadas?.longitude)

          return (
            <span className="font-mono text-xs text-muted">
              {latitude.toFixed(4)},{' '}
              {longitude.toFixed(4)}
            </span>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        sortable: true,
        width: '130px',
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        key: 'nivel_bateria',
        header: 'Nível da Bateria',
        align: 'center',
        sortable: true,
        width: '130px',
        render: (item) => <BatteryBadge level={item.nivel_bateria} />,
      },
      {
        key: 'ultimo_ping',
        header: 'Último Ping',
        align: 'center',
        sortable: true,
        width: '150px',
        render: (item) => (
          <span className="font-mono text-xs text-muted">
            {formatDateTime(item.ultimo_ping)}
          </span>
        ),
      },
      {
        key: 'criado_em',
        header: 'Criado em',
        align: 'center',
        sortable: true,
        width: '150px',
        render: (item) => (
          <span className="font-mono text-xs text-muted">
            {formatDateTime(item.criado_em ?? item.criadoEm)}
          </span>
        ),
      },
    ]

    if (canToggleStation) {
      baseColumns.push({
        key: 'actions',
        header: 'Ações',
        align: 'right',
        width: '90px',
        render: (item) => {
          // O PATCH só aceita Ativa/Inativa; alternar aqui apagaria o "Com Falha".
          const comFalha = item.status === 'Com Falha'
          return (
            <div
              className="flex items-center justify-end"
              title={comFalha ? 'Estação com falha: o status não pode ser alternado.' : undefined}
            >
              <Toggle
                label={`Alternar status da estação ${item.codigo}`}
                checked={item.ativo}
                busy={togglingId === item.id}
                disabled={comFalha}
                onChange={() => handleToggleStatus(item.id)}
              />
            </div>
          )
        },
      })
    }

    return baseColumns
  }, [togglingId, handleToggleStatus, canToggleStation])

  if (!canViewStations) {
    return (
      <div className="min-h-screen bg-base-100 p-6 sm:p-10 text-base-content">
        <Toast notification={notification} onClose={() => setNotification(null)} />
        <div className="max-w-7xl mx-auto space-y-6">
          <header className="border-b border-line pb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
              Inventário de Estações
            </h1>
          </header>
          <div
            role="alert"
            aria-label="Acesso negado"
            className="rounded-xl border border-error/30 bg-error/10 p-8 text-error flex flex-col items-center justify-center text-center gap-3 my-8"
          >
            <div className="size-12 rounded-full bg-error/20 flex items-center justify-center text-error">
              <Icon name="alert" size={24} />
            </div>
            <h2 className="text-lg font-semibold text-error">Acesso Negado</h2>
            <p className="text-sm text-base-content/80 max-w-md">
              Você não possui permissão para visualizar o inventário de estações.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 p-6 sm:p-10 text-base-content">
      <Toast notification={notification} onClose={() => setNotification(null)} />

      {selectedStation && (
        <Modal
          title={`Detalhes da Estação - ${selectedStation.codigo}`}
          description="Informações cadastrais e coordenadas geográficas da estação."
          onClose={() => setSelectedStation(null)}
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-line bg-base-300/40 p-4 space-y-3">
              <div>
                <span className="text-xs text-muted block">Código:</span>
                <span className="font-mono text-primary font-bold text-base">
                  {selectedStation.codigo}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted block">Nome da Localidade:</span>
                <span className="font-medium text-base-content text-sm">
                  {selectedStation.nome}
                </span>
              </div>
              {selectedStation.municipio && (
                <div>
                  <span className="text-xs text-muted block">Município:</span>
                  <span className="font-medium text-base-content text-sm">
                    {selectedStation.municipio}
                  </span>
                </div>
              )}
              <div>
                <span className="text-xs text-muted block">Coordenadas:</span>
                <span className="font-mono text-xs text-base-content">
                  Lat: {getCoordinateValue(selectedStation.latitude ?? selectedStation.coordenadas?.latitude).toFixed(4)} | Lon:{' '}
                  {getCoordinateValue(selectedStation.longitude ?? selectedStation.coordenadas?.longitude).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-xs text-muted block mb-1">Status:</span>
                  <StatusBadge status={selectedStation.status} />
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted block mb-1">Operacional:</span>
                  <span
                    className={`text-xs font-semibold ${
                      selectedStation.ativo ? 'text-success' : 'text-muted'
                    }`}
                  >
                    {selectedStation.ativo ? 'Ligada' : 'Desligada'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-line/50">
                <div>
                  <span className="text-xs text-muted block mb-1">Nível da Bateria:</span>
                  <BatteryBadge level={selectedStation.nivel_bateria} />
                </div>
                <div>
                  <span className="text-xs text-muted block mb-1">Último Ping:</span>
                  <span className="font-mono text-xs text-base-content">
                    {formatDateTime(selectedStation.ultimo_ping)}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-line/50">
                <span className="text-xs text-muted block mb-1">Criado em:</span>
                <span className="font-mono text-xs text-base-content">
                  {formatDateTime(selectedStation.criado_em ?? selectedStation.criadoEm)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedStation(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isNewStationModalOpen && canCreateStation && (
        <Modal
          title="Nova Estação"
          description="Preencha os dados abaixo para registrar uma nova estação no inventário."
          onClose={() => setIsNewStationModalOpen(false)}
          busy={isSubmitting}
        >
          <form onSubmit={handleCreateStation} className="space-y-4">
            <Input
              label="Código da Estação *"
              placeholder="Ex: EST-SJC-003"
              value={formCodigo}
              onChange={(e) => setFormCodigo(e.target.value)}
              required
            />

            <Input
              label="Nome da Localidade *"
              placeholder="Ex: São José dos Campos - Leste"
              value={formNome}
              onChange={(e) => setFormNome(e.target.value)}
              required
            />

            {isAdmin && (
              <Input
                label="Município *"
                placeholder="Ex: São José dos Campos"
                value={formMunicipio}
                onChange={(e) => setFormMunicipio(e.target.value)}
                required
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Latitude *"
                type="number"
                step="any"
                placeholder="Ex: -23.1896"
                value={formLat}
                onChange={(e) => setFormLat(e.target.value)}
                required
              />
              <Input
                label="Longitude *"
                type="number"
                step="any"
                placeholder="Ex: -45.8841"
                value={formLon}
                onChange={(e) => setFormLon(e.target.value)}
                required
              />
            </div>

            <div>
              <span className="mb-1.5 block text-xs font-semibold tracking-wide text-muted">
                Status Inicial
              </span>
              <div className="flex items-center">
                <StatusBadge status="Ativa" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <Button
                variant="secondary"
                onClick={() => setIsNewStationModalOpen(false)}
                type="button"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button variant="primary" type="submit" busy={isSubmitting}>
                Salvar Estação
              </Button>
            </div>
          </form>
        </Modal>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
              Inventário de Estações
            </h1>
            <p className="mt-1 text-sm text-muted">
              {plural(counts.total, 'estação cadastrada', 'estações cadastradas')} ·{' '}
              {plural(counts.ativas, 'ativa', 'ativas')}
              {counts.comFalha > 0 && ` · ${counts.comFalha} com falha`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              busy={loading}
              title="Atualizar lista de estações"
              className="w-full sm:w-auto"
            >
              <Icon name="refresh" size={14} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            {canCreateStation && (
              <Button
                variant="primary"
                aria-label="+ Nova Estação"
                onClick={() => setIsNewStationModalOpen(true)}
                className="w-full sm:w-auto"
              >
                <Icon name="plus" size={16} />
                Nova Estação
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center overflow-x-auto pb-1 lg:pb-0">
            <Filter
              collapse={false}
              options={filterOptions}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val as FilterStatus)
                setCurrentPage(1)
              }}
              showReset={false}
            />
          </div>

          <div className="w-full lg:w-80 shrink-0">
            <SearchInput
              placeholder="Buscar por código ou localidade..."
              value={searchQuery}
              loading={loading}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              onClear={() => {
                setSearchQuery('')
                setCurrentPage(1)
              }}
              onSearch={(val) => {
                setSearchQuery(val)
                setCurrentPage(1)
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-line bg-base-200/50 shadow-sm overflow-hidden relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-base-100/60 backdrop-blur-[2px]">
              <Loading size="lg" text="Carregando dados das estações..." />
            </div>
          )}

          {error && !loading ? (
            <div
              role="alert"
              className="flex flex-col items-center justify-center gap-3 p-10 text-center"
            >
              <p className="text-sm font-semibold text-error">
                Não foi possível carregar as estações.
              </p>
              <p className="text-xs text-muted">{error}</p>
              <Button variant="secondary" onClick={handleRefresh}>
                <Icon name="refresh" size={14} />
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <Table
                columns={columns}
                data={paginatedStations}
                loading={loading}
                emptyMessage={
                  searchQuery || statusFilter !== 'Todas'
                    ? 'Nenhuma estação encontrada com os filtros aplicados.'
                    : 'Nenhuma estação cadastrada.'
                }
                keyExtractor={(item) => item.id}
                containerClassName="border-0 rounded-none bg-transparent shadow-none"
              />

              <Pagination
                page={currentPage}
                pageSize={pageSize}
                total={totalFiltered}
                onPage={(page) => setCurrentPage(page)}
                onPageSize={(size) => {
                  setPageSize(size)
                  setCurrentPage(1)
                }}
                itemLabel="estações"
                infoText={
                  <span className="text-[13px] text-muted">
                    Mostrando{' '}
                    <strong className="text-base-content font-semibold">
                      {totalFiltered}
                    </strong>{' '}
                    de{' '}
                    <strong className="text-base-content font-semibold">
                      {counts.total}
                    </strong>{' '}
                    {counts.total === 1 ? 'estação' : 'estações'}
                  </span>
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Stations
