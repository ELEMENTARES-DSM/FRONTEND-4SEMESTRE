import axios from 'axios'
import api from '../../api/instance'
import type { CreateStationDTO, Station, StationStatus } from '../../types/stations'
import { StationConflictError } from './stations.errors'

const toNumber = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeStation = (
  station: Partial<Station> & { latitude?: number | string; longitude?: number | string },
): Station => {
  const latitude = toNumber(station.latitude ?? station.coordenadas?.latitude)
  const longitude = toNumber(station.longitude ?? station.coordenadas?.longitude)

  return {
    ...station,
    id: station.id ?? `est-${Date.now()}`,
    codigo: station.codigo ?? '',
    nome: station.nome ?? '',
    municipio: station.municipio ?? 'São José dos Campos',
    coordenadas: { latitude, longitude },
    latitude,
    longitude,
    status: station.status ?? 'Ativa',
    ativo: station.ativo ?? (station.status ?? 'Ativa') !== 'Inativa',
  } as Station
}

export const stationsApiService = {
  async getStations(): Promise<Station[]> {
    const response = await api.get<Station[]>('/estacoes')
    return (response.data ?? []).map((station) => normalizeStation(station))
  },

  async createStation(data: CreateStationDTO): Promise<Station> {
    try {
      const response = await api.post<Station>('/estacoes', data)
      const stationPayload = response.data ?? {
        id: `est-${Date.now()}`,
        codigo: data.codigo,
        nome: data.nome,
        municipio: data.municipio,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status ?? 'Ativa',
        ativo: true,
        criado_em: new Date().toISOString(),
        criadoEm: new Date().toISOString(),
      }

      return normalizeStation(stationPayload)
    } catch (error: unknown) {
      const isConflict =
        (axios.isAxiosError(error) && error.response?.status === 409) ||
        (typeof error === 'object' &&
          error !== null &&
          'response' in error &&
          (error as { response?: { status?: number } }).response?.status === 409) ||
        (typeof error === 'object' &&
          error !== null &&
          'status' in error &&
          (error as { status?: number }).status === 409)

      if (isConflict) {
        throw new StationConflictError()
      }

      throw error
    }
  },

  async updateStationStatus(
    id: string,
    ativo: boolean,
    status: StationStatus,
  ): Promise<Partial<Station>> {
    const response = await api.patch<Partial<Station>>(`/estacoes/${id}/status`, {
      ativo,
      status,
    })

    const responseData = response?.data ?? {}
    return {
      id,
      ativo,
      status,
      ...responseData,
    }
  },
}
