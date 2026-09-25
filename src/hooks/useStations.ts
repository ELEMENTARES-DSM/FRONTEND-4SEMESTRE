import { useState, useCallback, useEffect } from 'react'
import type { CreateStationDTO, Station, StationStatus } from '../types/stations'
import { stationsService } from '../services/stations/stations.service'

export interface UseStationsOptions {
  initialStations?: Station[]
  autoFetch?: boolean
}

export function useStations(options: UseStationsOptions = {}) {
  const { initialStations, autoFetch = true } = options
  const [stations, setStations] = useState<Station[]>(initialStations ?? [])
  const [loading, setLoading] = useState(autoFetch && initialStations === undefined)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await stationsService.getStations()
      setStations(data)
      return data
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Falha ao sincronizar com a fonte de dados.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    if (autoFetch && initialStations === undefined) {
      stationsService
        .getStations()
        .then((data) => {
          if (!ignore) {
            setStations(data)
            setError(null)
          }
        })
        .catch((err: unknown) => {
          if (!ignore) {
            setError(
              err instanceof Error
                ? err.message
                : 'Falha ao sincronizar com a fonte de dados.',
            )
          }
        })
        .finally(() => {
          if (!ignore) {
            setLoading(false)
          }
        })
    }

    return () => {
      ignore = true
    }
  }, [autoFetch, initialStations])

  const createStation = useCallback(async (data: CreateStationDTO): Promise<Station> => {
    setError(null)
    const newStation = await stationsService.createStation(data)
    setStations((prev) => [newStation, ...prev])
    return newStation
  }, [])

  const toggleStationStatus = useCallback(
    async (stationId: string): Promise<Station> => {
      const station = stations.find((s) => s.id === stationId)
      if (!station) {
        throw new Error(`Estação com id "${stationId}" não encontrada.`)
      }

      const nextAtivo = !station.ativo
      const nextStatus: StationStatus = nextAtivo ? 'Ativa' : 'Inativa'

      setTogglingId(stationId)
      setError(null)
      try {
        const updated = await stationsService.updateStationStatus(
          stationId,
          nextAtivo,
          nextStatus,
        )

        const finalStation: Station = {
          ...station,
          ...updated,
          ativo: nextAtivo,
          status: nextStatus,
        }

        setStations((prev) =>
          prev.map((item) => (item.id === stationId ? finalStation : item)),
        )
        return finalStation
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : `Erro ao alterar o status da estação ${station.codigo}.`
        setError(message)
        throw err
      } finally {
        setTogglingId(null)
      }
    },
    [stations],
  )

  return {
    stations,
    setStations,
    loading,
    togglingId,
    error,
    refresh: fetchStations,
    createStation,
    toggleStationStatus,
  }
}
