export type StationStatus = 'Ativa' | 'Inativa' | 'Com Falha'

export type FilterStatus = 'Todas' | 'Ativas' | 'Inativas' | 'Com Falha'

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
  latitude?: number
  longitude?: number
  status: StationStatus
  ativo: boolean
  nivel_bateria?: number | null
  ultimo_ping?: string | Date | null
  criado_em?: string | Date
  criadoEm?: string
  atualizadoEm?: string
  /** MAC da placa (12 hex minúsculos): identificador do tópico MQTT. */
  mac_address?: string | null
}

export interface StationsProps {
  initialStations?: Station[]
}

export interface CreateStationDTO {
  mac_address: string
  codigo: string
  nome: string
  municipio?: string
  latitude: number
  longitude: number
}

export interface UpdateStationStatusDTO {
  ativo: boolean
  status: StationStatus
}
