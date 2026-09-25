import { AxiosError } from 'axios';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import type { EstacaoStatus } from '../services/estacoesService';

const unidades = {
  Temperatura: '°C',
  'Umidade Relativa': '%',
  'PM2.5': 'µg/m³',
  PM10: 'µg/m³',
  'Velocidade do Vento': 'km/h',
};

const estacoes: EstacaoStatus[] = [
  { id: '11111111-1111-4111-8111-111111111111', codigo: 'EST-001', nome: 'Estação Centro', municipio: 'São José dos Campos', status_operacional: 'Ativa', ultimo_ping: new Date(Date.now() - 60000).toISOString(), minutos_sem_sinal: 1 },
  { id: '22222222-2222-4222-8222-222222222222', codigo: 'EST-002', nome: 'Estação Jardim das Flores', municipio: 'São José dos Campos', status_operacional: 'Com Falha', ultimo_ping: new Date(Date.now() - 60 * 60000).toISOString(), minutos_sem_sinal: 60 },
  { id: '33333333-3333-4333-8333-333333333333', codigo: 'EST-003', nome: 'Estação Parque Municipal', municipio: 'São José dos Campos', status_operacional: 'Inativa', ultimo_ping: null, minutos_sem_sinal: null },
];

interface MockSensor {
  codigo: string;
  nome: string;
  id: string;
  estacao_id: string;
  tipo: keyof typeof unidades;
  unidade_medida: string;
  fator: string;
  ganho: string;
  status: 'Ativo' | 'Inativo';
}

const sensores: MockSensor[] = [
  { codigo: 'TEMP-01', nome: 'Temperatura do ar', id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', estacao_id: estacoes[0].id, tipo: 'Temperatura', unidade_medida: '°C', fator: '1.000000', ganho: '0.000000', status: 'Ativo' },
  { codigo: 'UMID-01', nome: 'Umidade relativa do ar', id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', estacao_id: estacoes[0].id, tipo: 'Umidade Relativa', unidade_medida: '%', fator: '1.000000', ganho: '0.000000', status: 'Inativo' },
  { codigo: 'PM25-01', nome: 'Qualidade do ar', id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', estacao_id: estacoes[1].id, tipo: 'PM2.5', unidade_medida: 'µg/m³', fator: '1.025000', ganho: '-0.500000', status: 'Ativo' },
];

// Dados em memória: recarregar a página restaura os exemplos.
export const mockApiAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 350));
  const url = config.url ?? '';
  const method = config.method?.toLowerCase();
  const response = (data: unknown, status = 200): AxiosResponse => ({
    data: structuredClone(data), status, statusText: String(status), config, headers: {},
  });
  const fail = (status: number, message: string): never => {
    throw new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, undefined, response({ message }, status));
  };
  // Mesmo envelope retornado pelo backend.
  if (method === 'get' && url === '/estacoes/status') return response({
    resumo: { total: 3, ativas: 1, com_falha: 1, inativas: 1 },
    estacoes,
  });
  const collection = url.match(/^\/estacoes\/([^/]+)\/sensores$/);
  if (collection) {
    const estacaoId = collection[1];
    if (!estacoes.some((item) => item.id === estacaoId)) return fail(404, 'Estação não encontrada.');
    if (method === 'get') return response(sensores.filter((item) => item.estacao_id === estacaoId));
    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      if (!body || !Object.hasOwn(unidades, body.tipo)) return fail(400, 'Tipo inválido.');
      const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : '';
      const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
      if (!codigo || codigo.length > 30 || !nome || nome.length > 100) return fail(400, 'Código e nome são obrigatórios (máximo de 30 e 100 caracteres).');
      if (sensores.some((item) => item.estacao_id === estacaoId && item.codigo === codigo)) return fail(409, 'Código já cadastrado nesta estação.');
      const tipo = body.tipo as MockSensor['tipo'];
      const fator = body.fator ?? 1;
      const ganho = body.ganho ?? 0;
      if (![fator, ganho].every((value) => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 999999.999999)) return fail(400, 'Calibração inválida.');
      if (sensores.some((item) => item.estacao_id === estacaoId && item.tipo === tipo)) return fail(409, 'Esta estação já possui um sensor deste tipo.');
      const sensor: MockSensor = { codigo, nome, id: crypto.randomUUID(), estacao_id: estacaoId, tipo, unidade_medida: unidades[tipo], fator: fator.toFixed(6), ganho: ganho.toFixed(6), status: 'Ativo' };
      sensores.push(sensor);
      return response(sensor, 201);
    }
  }
  const statusRoute = url.match(/^\/sensores\/([^/]+)\/status$/);
  if (method === 'patch' && statusRoute) {
    const sensor = sensores.find((item) => item.id === statusRoute[1]);
    if (!sensor) return fail(404, 'Sensor não encontrado.');
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    if (body?.status !== 'Ativo' && body?.status !== 'Inativo') return fail(400, 'Status inválido.');
    sensor.status = body.status;
    return response(sensor);
  }
  return fail(404, 'Rota não mockada.');
};
