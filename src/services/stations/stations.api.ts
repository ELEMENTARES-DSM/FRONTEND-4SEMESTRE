import axios from 'axios'
import api from '../../api/instance'
import type { CreateStationDTO, Station, StationStatus } from '../../types/stations'
import { StationConflictError, StationForbiddenError } from './stations.errors'

// Formato que o back devolve: NUMERIC chega como string e não existe coluna "ativo".
type ApiStation = Omit<Station, 'coordenadas' | 'latitude' | 'longitude' | 'ativo'> & {
  latitude: number | string
  longitude: number | string
}

function extractForbiddenMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as { erro?: string; message?: string }
    return data.erro || data.message || 'Acesso negado. Perfil insuficiente para esta ação.'
  }
  return 'Acesso negado. Perfil insuficiente para esta ação.'
}

const normalizeStation = (station: ApiStation): Station => {
  const latitude = Number(station.latitude)
  const longitude = Number(station.longitude)

  return {
    ...station,
    coordenadas: { latitude, longitude },
    latitude,
    longitude,
    // Só a Inativa fica com o switch desligado; Ativa e Com Falha estão em operação.
    ativo: station.status !== 'Inativa',
  }
}

export const stationsApiService = {
  async getStations(): Promise<Station[]> {
    try {
      const response = await api.get<ApiStation[]>('/estacoes')
      return response.data.map(normalizeStation)
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new StationForbiddenError(extractForbiddenMessage(error))
      }
      throw error
    }
  },

  async createStation(data: CreateStationDTO): Promise<Station> {
    try {
      const response = await api.post<ApiStation>('/estacoes', data)
      return normalizeStation(response.data)
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new StationForbiddenError(extractForbiddenMessage(error))
      }

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
    try {
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
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw new StationForbiddenError(extractForbiddenMessage(error))
      }
      throw error
    }
  },
}

