import type { CreateStationDTO, Station, StationStatus } from '../../types/stations'
import { stationsApiService } from './stations.api'

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
 * Retorna a implementação de serviço conforme VITE_USE_MOCKS (a mesma flag do resto do app).
 * A condição fica inline com o import dinâmico: no build de produção DEV vira false,
 * o ramo é removido e o mock não entra no bundle.
 */
export async function getStationsService(): Promise<StationsService> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
    const { stationsMockService } = await import('./stations.mock')
    return stationsMockService
  }
  return stationsApiService
}

/**
 * Serviço de domínio de estações.
 * Expõe operações para a aplicação desacoplando-a de detalhes de transporte ou mock.
 */
export const stationsService: StationsService = {
  getStations: async () => (await getStationsService()).getStations(),
  createStation: async (data: CreateStationDTO) =>
    (await getStationsService()).createStation(data),
  updateStationStatus: async (id: string, ativo: boolean, status: StationStatus) =>
    (await getStationsService()).updateStationStatus(id, ativo, status),
}
