import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/instance'
import { getStationsService, stationsService } from './stations.service'
import { stationsMockService, resetMockStations } from './stations.mock'
import { stationsApiService } from './stations.api'
import { StationConflictError, StationNotFoundError } from './stations.errors'
import stationsSourceCode from '../../pages/Stations.tsx?raw'

describe('Stations Feature - Camada de Serviços, Mock e API', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    resetMockStations()
  })

  it('1. VITE_USE_MOCKS=true seleciona a implementação mock', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true')
    expect(await getStationsService()).toBe(stationsMockService)
  })

  it('2. VITE_USE_MOCKS=false seleciona a implementação da API', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    expect(await getStationsService()).toBe(stationsApiService)
  })

  it('2.1. Fora do modo de desenvolvimento o mock nunca é usado, mesmo com VITE_USE_MOCKS=true', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'true')
    vi.stubEnv('DEV', false)
    expect(await getStationsService()).toBe(stationsApiService)
  })

  it('2.2. A flag antiga VITE_USE_MOCK (sem S) não liga o mock', async () => {
    vi.stubEnv('VITE_USE_MOCKS', 'false')
    vi.stubEnv('VITE_USE_MOCK', 'true')
    expect(await getStationsService()).toBe(stationsApiService)
  })

  it('3. Mock consegue listar estações', async () => {
    const stations = await stationsMockService.getStations()
    expect(Array.isArray(stations)).toBe(true)
    expect(stations.length).toBeGreaterThan(0)
    expect(stations[0]).toHaveProperty('codigo')
    expect(stations[0]).toHaveProperty('status')
  })

  it('4. Mock consegue criar estação', async () => {
    const newStationData = {
      codigo: 'EST-TEST-001',
      nome: 'Estação de Teste Mock',
      municipio: 'São José dos Campos',
      latitude: -23.1234,
      longitude: -45.5678,
    }

    const created = await stationsMockService.createStation(newStationData)
    expect(created.id).toBeDefined()
    expect(created.codigo).toBe('EST-TEST-001')
    expect(created.nome).toBe('Estação de Teste Mock')
    expect(created.status).toBe('Ativa')
    expect(created.ativo).toBe(true)

    // Verifica se foi persistida em memória no mock
    const all = await stationsMockService.getStations()
    expect(all.some((s) => s.codigo === 'EST-TEST-001')).toBe(true)
  })

  it('4.1. API normaliza coordenadas vindas como string para número', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: [
        {
          id: 'est-1',
          codigo: 'EST-1',
          nome: 'E1',
          municipio: 'SJC',
          latitude: '-23.1234',
          longitude: '-45.5678',
          status: 'Ativa',
        },
      ],
    })

    const stations = await stationsApiService.getStations()
    expect(stations[0].coordenadas.latitude).toBe(-23.1234)
    expect(stations[0].coordenadas.longitude).toBe(-45.5678)
    expect(typeof stations[0].coordenadas.latitude).toBe('number')
    expect(typeof stations[0].coordenadas.longitude).toBe('number')
  })

  it('4.2. API não inventa município e deriva o switch do status (Com Falha segue ligado)', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: [
        { id: 'a', codigo: 'A', nome: 'A', municipio: 'Taubaté', latitude: '0', longitude: '0', status: 'Ativa' },
        { id: 'b', codigo: 'B', nome: 'B', municipio: 'Taubaté', latitude: '0', longitude: '0', status: 'Inativa' },
        { id: 'c', codigo: 'C', nome: 'C', municipio: 'Taubaté', latitude: '0', longitude: '0', status: 'Com Falha' },
      ],
    })

    const stations = await stationsApiService.getStations()
    expect(stations.map((s) => s.municipio)).toEqual(['Taubaté', 'Taubaté', 'Taubaté'])
    expect(stations.map((s) => [s.status, s.ativo])).toEqual([
      ['Ativa', true],
      ['Inativa', false],
      ['Com Falha', true],
    ])
  })

  it('5. Mock consegue alterar status', async () => {
    const all = await stationsMockService.getStations()
    const target = all[0]

    const updated = await stationsMockService.updateStationStatus(
      target.id,
      !target.ativo,
      target.ativo ? 'Inativa' : 'Ativa',
    )

    expect(updated.id).toBe(target.id)
    expect(updated.ativo).toBe(!target.ativo)
    expect(updated.status).toBe(target.ativo ? 'Inativa' : 'Ativa')
  })

  it('Mock lança erro ao tentar alterar status de estação inexistente', async () => {
    await expect(
      stationsMockService.updateStationStatus('est-inexistente-999', false, 'Inativa'),
    ).rejects.toThrow(StationNotFoundError)
  })

  it('6. Mock consegue detectar código duplicado', async () => {
    const duplicateData = {
      codigo: 'EST-SJC-001', // código que já existe no INITIAL_STATIONS
      nome: 'Tentativa Duplicada',
      municipio: 'São José dos Campos',
      latitude: -23.1,
      longitude: -45.1,
    }

    await expect(stationsMockService.createStation(duplicateData)).rejects.toThrow(
      StationConflictError,
    )
    await expect(stationsMockService.createStation(duplicateData)).rejects.toThrow(
      'Identificador de estação já cadastrado no sistema',
    )
  })

  it('7. API utiliza os endpoints corretos (GET, POST, PATCH)', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: [{ id: 'est-1', codigo: 'EST-1', nome: 'E1', status: 'Ativa', ativo: true }],
    })
    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { id: 'est-2', codigo: 'EST-2', nome: 'E2', status: 'Ativa', ativo: true },
    })
    const patchSpy = vi.spyOn(api, 'patch').mockResolvedValueOnce({
      data: { id: 'est-1', ativo: false, status: 'Inativa' },
    })

    // GET /estacoes
    const stations = await stationsApiService.getStations()
    expect(getSpy).toHaveBeenCalledWith('/estacoes')
    expect(stations).toHaveLength(1)

    // POST /estacoes
    const newStationData = {
      codigo: 'EST-2',
      nome: 'E2',
      latitude: -23.0,
      longitude: -45.0,
    }
    await stationsApiService.createStation(newStationData)
    expect(postSpy).toHaveBeenCalledWith('/estacoes', newStationData)

    // PATCH /estacoes/:id
    await stationsApiService.updateStationStatus('est-1', false, 'Inativa')
    expect(patchSpy).toHaveBeenCalledWith('/estacoes/est-1/status', {
      ativo: false,
      status: 'Inativa',
    })
  })

  it('8. Erro 409 da API é convertido para o erro/resultado esperado pelo domínio (StationConflictError)', async () => {
    vi.spyOn(api, 'post').mockRejectedValue({
      response: {
        status: 409,
        data: { message: 'Identificador duplicado' },
      },
      status: 409,
    })

    const data = {
      codigo: 'EST-EXISTENTE',
      nome: 'Conflito',
      latitude: -23.0,
      longitude: -45.0,
    }

    await expect(stationsApiService.createStation(data)).rejects.toThrow(
      StationConflictError,
    )
    await expect(stationsApiService.createStation(data)).rejects.toThrow(
      'Identificador de estação já cadastrado no sistema',
    )
  })

  it('9. Stations.tsx não depende diretamente de Axios', () => {
    expect(stationsSourceCode).not.toMatch(/from\s+['"]axios['"]/)
    expect(stationsSourceCode).not.toMatch(/import\s+axios/)
    expect(stationsSourceCode).not.toMatch(/axios\./)
    expect(stationsSourceCode).not.toMatch(/axios\.isAxiosError/)
  })

  it('10. Stations.tsx não acessa import.meta.env', () => {
    expect(stationsSourceCode).not.toContain('import.meta.env')
  })

  it('11. Nenhuma chamada HTTP é realizada quando o modo mock está ativo', async () => {
    const getSpy = vi.spyOn(api, 'get')
    const postSpy = vi.spyOn(api, 'post')
    const patchSpy = vi.spyOn(api, 'patch')

    vi.stubEnv('VITE_USE_MOCKS', 'true')

    await stationsService.getStations()
    await stationsService.createStation({
      codigo: 'EST-MOCK-NO-HTTP',
      nome: 'Sem HTTP',
      latitude: -23.0,
      longitude: -45.0,
    })
    await stationsService.updateStationStatus('est-001', false, 'Inativa')

    expect(getSpy).not.toHaveBeenCalled()
    expect(postSpy).not.toHaveBeenCalled()
    expect(patchSpy).not.toHaveBeenCalled()
  })
})
