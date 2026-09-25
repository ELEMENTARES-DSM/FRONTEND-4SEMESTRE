import axios from 'axios'
import api from '../../api/instance'
import type { CreateStationDTO, Station, StationStatus } from '../../types/stations'
import { StationConflictError } from './stations.errors'

export const stationsApiService = {
  async getStations(): Promise<Station[]> {
    const response = await api.get<Station[]>('/estacoes')
    return response.data ?? []
  },

  async createStation(data: CreateStationDTO): Promise<Station> {
    try {
      const response = await api.post<Station>('/estacoes', data)
      return (
        response.data ?? {
          id: `est-${Date.now()}`,
          ...data,
          criado_em: new Date().toISOString(),
          criadoEm: new Date().toISOString(),
        }
      )
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
    const response = await api.patch<Partial<Station>>(`/estacoes/${id}`, {
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
