import type { CreateStationDTO, Station, StationStatus } from '../../types/stations'
import { StationConflictError, StationNotFoundError } from './stations.errors'

export const INITIAL_STATIONS: Station[] = [
  {
    id: 'est-001',
    codigo: 'EST-SJC-001',
    nome: 'São José dos Campos - Centro',
    municipio: 'São José dos Campos',
    coordenadas: { latitude: -23.1791, longitude: -45.8872 },
    status: 'Ativa',
    ativo: true,
    nivel_bateria: 95,
    ultimo_ping: '2026-03-24T18:30:00Z',
    criado_em: '2026-01-10T09:00:00Z',
    criadoEm: '2026-01-10T09:00:00Z',
  },
  {
    id: 'est-002',
    codigo: 'EST-SJC-002',
    nome: 'São José dos Campos - Satélite',
    coordenadas: { latitude: -23.2237, longitude: -45.8914 },
    status: 'Ativa',
    ativo: true,
    nivel_bateria: 82,
    ultimo_ping: '2026-03-24T18:25:00Z',
    criado_em: '2026-01-12T14:30:00Z',
    criadoEm: '2026-01-12T14:30:00Z',
  },
  {
    id: 'est-003',
    codigo: 'EST-JAC-001',
    nome: 'Jacareí - Vila Branca',
    coordenadas: { latitude: -23.2982, longitude: -45.9664 },
    status: 'Ativa',
    ativo: true,
    nivel_bateria: 60,
    ultimo_ping: '2026-03-24T18:20:00Z',
    criado_em: '2026-01-20T11:15:00Z',
    criadoEm: '2026-01-20T11:15:00Z',
  },
  {
    id: 'est-004',
    codigo: 'EST-TAU-001',
    nome: 'Taubaté - Independência',
    coordenadas: { latitude: -23.0264, longitude: -45.5558 },
    status: 'Ativa',
    ativo: true,
    nivel_bateria: 45,
    ultimo_ping: '2026-03-24T17:45:00Z',
    criado_em: '2026-02-01T08:00:00Z',
    criadoEm: '2026-02-01T08:00:00Z',
  },
  {
    id: 'est-005',
    codigo: 'EST-CAC-001',
    nome: 'Caçapava - Centro',
    coordenadas: { latitude: -23.1008, longitude: -45.7072 },
    status: 'Inativa',
    ativo: false,
    nivel_bateria: 12,
    ultimo_ping: '2026-03-20T10:12:00Z',
    criado_em: '2026-02-05T16:20:00Z',
    criadoEm: '2026-02-05T16:20:00Z',
  },
  {
    id: 'est-006',
    codigo: 'EST-PIN-001',
    nome: 'Pindamonhangaba - Crispim',
    coordenadas: { latitude: -22.9248, longitude: -45.4616 },
    status: 'Inativa',
    ativo: false,
    nivel_bateria: null,
    ultimo_ping: null,
    criado_em: '2026-02-10T13:40:00Z',
    criadoEm: '2026-02-10T13:40:00Z',
  },
  {
    id: 'est-007',
    codigo: 'EST-GUA-001',
    nome: 'Guaratinguetá - Pedregulho',
    coordenadas: { latitude: -22.8163, longitude: -45.1925 },
    status: 'Manutenção',
    ativo: false,
    nivel_bateria: 28,
    ultimo_ping: '2026-03-23T09:15:00Z',
    criado_em: '2026-02-18T10:00:00Z',
    criadoEm: '2026-02-18T10:00:00Z',
  },
  {
    id: 'est-008',
    codigo: 'EST-CPJ-001',
    nome: 'Campos do Jordão - Capivari',
    coordenadas: { latitude: -22.7394, longitude: -45.5913 },
    status: 'Em instalação',
    ativo: false,
    nivel_bateria: null,
    ultimo_ping: null,
    criado_em: '2026-03-01T15:00:00Z',
    criadoEm: '2026-03-01T15:00:00Z',
  },
]

let inMemoryStations: Station[] = INITIAL_STATIONS.map((s) => ({ ...s }))

export const resetMockStations = (stations: Station[] = INITIAL_STATIONS) => {
  inMemoryStations = stations.map((s) => ({ ...s }))
}

export const stationsMockService = {
  async getStations(): Promise<Station[]> {
    return inMemoryStations.map((s) => ({ ...s }))
  },

  async createStation(data: CreateStationDTO): Promise<Station> {
    const normalizedCodigo = data.codigo.trim().toUpperCase()
    const exists = inMemoryStations.some(
      (s) => s.codigo.trim().toUpperCase() === normalizedCodigo,
    )

    if (exists) {
      throw new StationConflictError()
    }

    const status = data.status ?? 'Ativa'
    const now = new Date().toISOString()
    const newStation: Station = {
      id: `est-${Date.now()}`,
      codigo: normalizedCodigo,
      nome: data.nome.trim(),
      municipio: data.municipio,
      coordenadas: { latitude: data.latitude, longitude: data.longitude },
      latitude: data.latitude,
      longitude: data.longitude,
      status,
      ativo: status !== 'Inativa',
      nivel_bateria: data.nivel_bateria ?? null,
      ultimo_ping: data.ultimo_ping ?? null,
      criado_em: now,
      criadoEm: now,
    }

    inMemoryStations = [newStation, ...inMemoryStations]
    return { ...newStation }
  },

  async updateStationStatus(
    id: string,
    ativo: boolean,
    status: StationStatus,
  ): Promise<Station> {
    const index = inMemoryStations.findIndex((s) => s.id === id)
    if (index === -1) {
      throw new StationNotFoundError(`Estação com id "${id}" não encontrada.`)
    }

    const updated: Station = {
      ...inMemoryStations[index],
      ativo,
      status,
      atualizadoEm: new Date().toISOString(),
    }

    inMemoryStations[index] = updated
    return { ...updated }
  },
}
