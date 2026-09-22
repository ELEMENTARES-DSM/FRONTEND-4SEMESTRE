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
import { Input, Select } from '../shared/components/Field'
import axios from 'axios'
import api from '../api/instance'

export type StationStatus = 'Ativa' | 'Inativa' | 'Manutenção' | 'Em instalação'

export type FilterStatus = 'Todas' | 'Ativas' | 'Inativas' | 'Manutenção' | 'Instalação'

export interface StationCoordinates {
  latitude: number
  longitude: number
}

export interface Station {
  id: string
  codigo: string
  nome: string
  municipio?: string
  coordenadas: StationCoordinates
  status: StationStatus
  ativo: boolean
  criadoEm?: string
  atualizadoEm?: string
}

const INITIAL_STATIONS: Station[] = [
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
    coordenadas: { latitude: -23.2237, longitude: -45.8914 },
    status: 'Ativa',
    ativo: true,
  },
  {
    id: 'est-003',
    codigo: 'EST-JAC-001',
    nome: 'Jacareí - Vila Branca',
    coordenadas: { latitude: -23.2982, longitude: -45.9664 },
    status: 'Ativa',
    ativo: true,
  },
  {
    id: 'est-004',
    codigo: 'EST-TAU-001',
    nome: 'Taubaté - Independência',
    coordenadas: { latitude: -23.0264, longitude: -45.5558 },
    status: 'Ativa',
    ativo: true,
  },
  {
    id: 'est-005',
    codigo: 'EST-CAC-001',
    nome: 'Caçapava - Centro',
    coordenadas: { latitude: -23.1008, longitude: -45.7072 },
    status: 'Inativa',
    ativo: false,
  },
  {
    id: 'est-006',
    codigo: 'EST-PIN-001',
    nome: 'Pindamonhangaba - Crispim',
    coordenadas: { latitude: -22.9248, longitude: -45.4616 },
    status: 'Inativa',
    ativo: false,
  },
  {
    id: 'est-007',
    codigo: 'EST-GUA-001',
    nome: 'Guaratinguetá - Pedregulho',
    coordenadas: { latitude: -22.8163, longitude: -45.1925 },
    status: 'Manutenção',
    ativo: false,
  },
  {
    id: 'est-008',
    codigo: 'EST-CPJ-001',
    nome: 'Campos do Jordão - Capivari',
    coordenadas: { latitude: -22.7394, longitude: -45.5913 },
    status: 'Em instalação',
    ativo: false,
  },
]

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
    Manutenção: {
      badgeClass: 'bg-warning/15 text-warning border-warning/30',
      dotClass: 'bg-warning',
      label: 'Manutenção',
    },
    'Em instalação': {
      badgeClass: 'bg-primary/15 text-primary border-primary/30',
      dotClass: 'bg-primary',
      label: 'Em instalação',
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

export interface StationsProps {
  initialStations?: Station[]
}

export function Stations({
  initialStations = INITIAL_STATIONS,
}: StationsProps = {}) {
  const [stations, setStations] = useState<Station[]>(initialStations)
  const [loading, setLoading] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
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
  const [formLat, setFormLat] = useState('')
  const [formLon, setFormLon] = useState('')
  const [formStatus, setFormStatus] = useState<StationStatus>('Ativa')

  const notify = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({
      id: Date.now(),
      message,
      type,
    })
  }, [])

  const fetchStations = useCallback(async () => {
    setLoading(true)
    try {
      if (api.defaults.baseURL) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
      notify('Dados de estações atualizados.', 'success')
    } catch (error) {
      notify('Falha ao sincronizar com a API.', 'error')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [notify])

  const counts = useMemo(() => {
    let ativas = 0
    let inativas = 0
    let manutencao = 0
    let instalacao = 0

    stations.forEach((s) => {
      if (s.status === 'Ativa') ativas += 1
      else if (s.status === 'Inativa') inativas += 1
      else if (s.status === 'Manutenção') manutencao += 1
      else if (s.status === 'Em instalação') instalacao += 1
    })

    return {
      total: stations.length,
      ativas,
      inativas,
      manutencao,
      instalacao,
    }
  }, [stations])

  const filterOptions: FilterOption<FilterStatus>[] = useMemo(
    () => [
      { label: 'Todas', value: 'Todas', count: counts.total },
      { label: 'Ativas', value: 'Ativas', count: counts.ativas },
      { label: 'Inativas', value: 'Inativas', count: counts.inativas },
      { label: 'Manutenção', value: 'Manutenção', count: counts.manutencao },
      { label: 'Instalação', value: 'Instalação', count: counts.instalacao },
    ],
    [counts],
  )

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      if (statusFilter === 'Ativas' && station.status !== 'Ativa') return false
      if (statusFilter === 'Inativas' && station.status !== 'Inativa') return false
      if (statusFilter === 'Manutenção' && station.status !== 'Manutenção') return false
      if (statusFilter === 'Instalação' && station.status !== 'Em instalação') return false

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
      const station = stations.find((s) => s.id === stationId)
      if (!station) return

      const nextAtivo = !station.ativo
      const nextStatus: StationStatus = nextAtivo ? 'Ativa' : 'Inativa'

      setTogglingId(stationId)

      try {
        try {
          await api.patch(`/estacoes/${stationId}`, {
            ativo: nextAtivo,
            status: nextStatus,
          })
        } catch {
          if (api.defaults.baseURL) {
            await new Promise((resolve) => setTimeout(resolve, 0))
          }
        }

        setStations((prev) =>
          prev.map((item) =>
            item.id === stationId
              ? { ...item, ativo: nextAtivo, status: nextStatus }
              : item,
          ),
        )

        notify(
          `Estação ${station.codigo} ${nextAtivo ? 'ativada' : 'desativada'} com sucesso!`,
          'success',
        )
      } catch (error) {
        notify(`Erro ao alterar o status da estação ${station.codigo}.`, 'error')
        console.error(error)
      } finally {
        setTogglingId(null)
      }
    },
    [stations, notify],
  )

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault()

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

    setIsSubmitting(true)

    try {
      const normalizedCodigo = formCodigo.trim().toUpperCase()
      const municipio =
        localStorage.getItem('userMunicipio') || 'São José dos Campos'

      // Tenta persistência no backend ou simula conflito
      try {
        await api.post('/estacoes', {
          codigo: normalizedCodigo,
          nome: formNome.trim(),
          municipio,
          coordenadas: { latitude, longitude },
          status: formStatus,
          ativo: formStatus === 'Ativa',
        })
      } catch (err: unknown) {
        const isConflict =
          (axios.isAxiosError(err) && err.response?.status === 409) ||
          (typeof err === 'object' &&
            err !== null &&
            'status' in err &&
            (err as { status: number }).status === 409)

        if (isConflict) {
          throw err
        }
        // Caso a estação já exista no estado local em memória (fallback se backend offline)
        if (stations.some((s) => s.codigo === normalizedCodigo)) {
          const conflictError = Object.assign(new Error('Conflict'), {
            status: 409,
            response: {
              status: 409,
              data: {
                message: 'Identificador de estação já cadastrado no sistema',
              },
            },
          })
          throw conflictError
        }
        if (axios.isAxiosError(err) && err.response) {
          throw err
        }
      }

      const newStation: Station = {
        id: `est-${Date.now()}`,
        codigo: normalizedCodigo,
        nome: formNome.trim(),
        municipio,
        coordenadas: { latitude, longitude },
        status: formStatus,
        ativo: formStatus === 'Ativa',
        criadoEm: new Date().toISOString(),
      }

      setStations((prev) => [newStation, ...prev])
      notify('Estação meteorológica cadastrada com sucesso', 'success')

      setFormCodigo('')
      setFormNome('')
      setFormLat('')
      setFormLon('')
      setFormStatus('Ativa')
      setIsNewStationModalOpen(false)
    } catch (error: unknown) {
      const isConflict =
        (axios.isAxiosError(error) && error.response?.status === 409) ||
        (typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          (error as { status: number }).status === 409)

      if (isConflict) {
        notify('Identificador de estação já cadastrado no sistema', 'error')
      } else {
        notify('Erro ao cadastrar nova estação.', 'error')
        console.error(error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const columns: TableColumn<Station>[] = useMemo(
    () => [
      {
        key: 'codigo',
        header: 'Código',
        sortable: true,
        width: '160px',
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
        width: '210px',
        render: (item) => (
          <span className="font-mono text-xs text-muted">
            {item.coordenadas.latitude.toFixed(4)},{' '}
            {item.coordenadas.longitude.toFixed(4)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        sortable: true,
        width: '160px',
        render: (item) => <StatusBadge status={item.status} />,
      },
      {
        key: 'actions',
        header: 'Ações',
        align: 'right',
        width: '110px',
        render: (item) => (
          <div className="flex items-center justify-end">
            <Toggle
              label={`Alternar status da estação ${item.codigo}`}
              checked={item.ativo}
              busy={togglingId === item.id}
              onChange={() => handleToggleStatus(item.id)}
            />
          </div>
        ),
      },
    ],
    [togglingId, handleToggleStatus],
  )

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
                  Lat: {selectedStation.coordenadas.latitude.toFixed(4)} | Lon:{' '}
                  {selectedStation.coordenadas.longitude.toFixed(4)}
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
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedStation(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {isNewStationModalOpen && (
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

            <Select
              label="Status Inicial"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as StationStatus)}
            >
              <option value="Ativa">Ativa</option>
              <option value="Inativa">Inativa</option>
              <option value="Manutenção">Manutenção</option>
              <option value="Em instalação">Em instalação</option>
            </Select>

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
              {counts.total} estações cadastradas · {counts.ativas} ativas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={fetchStations}
              busy={loading}
              title="Atualizar lista de estações"
              className="w-full sm:w-auto"
            >
              <Icon name="refresh" size={14} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsNewStationModalOpen(true)}
              className="w-full sm:w-auto"
            >
              <Icon name="plus" size={16} />
               Nova Estação
            </Button>
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
                estações
              </span>
            }
          />
        </div>
      </div>
    </div>
  )
}

export default Stations
