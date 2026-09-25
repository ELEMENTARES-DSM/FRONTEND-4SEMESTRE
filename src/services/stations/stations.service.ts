import { env } from '../../config/env'
import type { CreateStationDTO, Station, StationStatus } from '../../types/stations'
import { stationsApiService } from './stations.api'
import { stationsMockService } from './stations.mock'

export interface StationsService {
  getStations(): Promise<Station[]>
  createStation(data: CreateStationDTO): Promise<Station>
  updateStationStatus(
    id: string,
    ativo: boolean,
    status: StationStatus,
  ): Promise<Station | Partial<Station>>
}

/**
 * Retorna a implementação de serviço adequada baseada na variável de ambiente VITE_USE_MOCK.
 * Centraliza a decisão entre Mock e API real.
 */
export function getStationsService(): StationsService {
  return env.useMock ? stationsMockService : stationsApiService
}

/**
 * Serviço de domínio de estações.
 * Expõe operações para a aplicação desacoplando-a de detalhes de transporte ou mock.
 */
export const stationsService: StationsService = {
  getStations: () => getStationsService().getStations(),
  createStation: (data: CreateStationDTO) => getStationsService().createStation(data),
  updateStationStatus: (id: string, ativo: boolean, status: StationStatus) =>
    getStationsService().updateStationStatus(id, ativo, status),
}
