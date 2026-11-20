import { AxiosError } from 'axios';
import type { AxiosAdapter, AxiosResponse } from 'axios';
import type { EstacaoStatus } from '../services/estacoesService';
import type { Alarme, SeveridadeAlarme } from '../types/alarms';
import type { PeriodoAnalise } from '../services/analise/analise.service';
import {
  criarMockSeries,
  criarMockUltimasLeituras,
  mockIqar,
} from './analiseMock';

// Catálogo de grandezas no formato de GET /estacoes/tipos-sensor (carga inicial do backend).
const catalogo = [
  { id: '5a000001-0000-4000-8000-000000000001', nome: 'Temperatura', unidade: '°C', faixa_min: '-50.00', faixa_max: '60.00', agregacao: 'media' },
  { id: '5a000001-0000-4000-8000-000000000002', nome: 'Umidade Relativa', unidade: '%', faixa_min: '0.00', faixa_max: '100.00', agregacao: 'media' },
  { id: '5a000001-0000-4000-8000-000000000003', nome: 'PM2.5', unidade: 'µg/m³', faixa_min: '0.00', faixa_max: '1000.00', agregacao: 'media' },
  { id: '5a000001-0000-4000-8000-000000000004', nome: 'PM10', unidade: 'µg/m³', faixa_min: '0.00', faixa_max: '1000.00', agregacao: 'media' },
  { id: '5a000001-0000-4000-8000-000000000005', nome: 'Velocidade do Vento', unidade: 'km/h', faixa_min: '0.00', faixa_max: '400.00', agregacao: 'media' },
  { id: '5a000001-0000-4000-8000-000000000006', nome: 'Direção do Vento', unidade: '°', faixa_min: '0.00', faixa_max: '360.00', agregacao: 'media_circular' },
  { id: '5a000001-0000-4000-8000-000000000007', nome: 'Precipitação', unidade: 'mm', faixa_min: '0.00', faixa_max: '500.00', agregacao: 'soma' },
  { id: '5a000001-0000-4000-8000-000000000008', nome: 'Pressão Atmosférica', unidade: 'hPa', faixa_min: '600.00', faixa_max: '1100.00', agregacao: 'media' },
];

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
  tipo: string;
  unidade_medida: string;
  unidade_leitura: string | null;
  fator_conversao: string;
  offset: string;
  status: 'Ativo' | 'Inativo';
}

const sensores: MockSensor[] = [
  { codigo: 'TEMP-01', nome: 'Temperatura do ar', id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', estacao_id: estacoes[0].id, tipo: 'Temperatura', unidade_medida: '°C', unidade_leitura: null, fator_conversao: '1.000000', offset: '0.000000', status: 'Ativo' },
  { codigo: 'UMID-01', nome: 'Umidade relativa do ar', id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', estacao_id: estacoes[0].id, tipo: 'Umidade Relativa', unidade_medida: '%', unidade_leitura: null, fator_conversao: '1.000000', offset: '0.000000', status: 'Inativo' },
  { codigo: 'PM25-01', nome: 'Qualidade do ar', id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', estacao_id: estacoes[1].id, tipo: 'PM2.5', unidade_medida: 'µg/m³', unidade_leitura: null, fator_conversao: '1.025000', offset: '-0.500000', status: 'Ativo' },
];

// US-24: alarmes no formato de GET /alertas/alarmes (OpenAPI do alertas-notificacoes).
const minutosAtras = (minutos: number) => new Date(Date.now() - minutos * 60000).toISOString();
const alarme = (dados: Partial<Alarme> & Pick<Alarme, 'id' | 'severidade' | 'situacao'>): Alarme => ({
  regra_id: '7b1e2c3d-4f5a-4b6c-8d7e-9f0a1b2c3d4e',
  regra_nome: 'PM2.5 crítico',
  sensor_id: sensores[2].id,
  sensor_codigo: sensores[2].codigo,
  sensor_tipo: sensores[2].tipo,
  sensor_unidade_medida: sensores[2].unidade_medida,
  estacao_id: estacoes[1].id,
  estacao_codigo: estacoes[1].codigo,
  estacao_nome: estacoes[1].nome,
  municipio: 'São José dos Campos',
  valor: 52.3,
  operador: '>=',
  limite: 50,
  lido_em: minutosAtras(5),
  criado_em: minutosAtras(5),
  normalizado_em: null,
  ...dados,
});
const alarmes: Alarme[] = [
  alarme({ id: '0b6f2a4e-1c3d-4e5f-8a9b-1c2d3e4f5a6b', severidade: 'CRITICO', situacao: 'aberto' }),
  alarme({
    id: '1c7a3b5f-2d4e-4f6a-9b0c-2d3e4f5a6b7c', severidade: 'ALERTA', situacao: 'aberto',
    regra_id: '8c2f3d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f', regra_nome: 'Calor forte',
    sensor_id: sensores[0].id, sensor_codigo: sensores[0].codigo, sensor_tipo: sensores[0].tipo,
    sensor_unidade_medida: sensores[0].unidade_medida, estacao_id: estacoes[0].id,
    estacao_codigo: estacoes[0].codigo, estacao_nome: estacoes[0].nome,
    valor: 36.2, limite: 35, lido_em: minutosAtras(20), criado_em: minutosAtras(20),
  }),
  alarme({
    id: '2d8b4c6a-3e5f-4a7b-8c1d-3e4f5a6b7c8d', severidade: 'ATENCAO', situacao: 'normalizado',
    regra_nome: 'PM2.5 moderado', limite: 35, valor: 40.1,
    lido_em: minutosAtras(180), criado_em: minutosAtras(180), normalizado_em: minutosAtras(120),
  }),
];

// Códigos que as estações já mandaram. O mock devolve só os que ainda não têm sensor
// (de qualquer status, comparação exata), como o backend.
const recebidos: Record<string, Array<{ codigo: string; total: number; ultimo_valor: number | null; ultima_leitura_em: string }>> = {
  [estacoes[0].id]: [
    { codigo: 'PM25', total: 12, ultimo_valor: 12, ultima_leitura_em: minutosAtras(3) },
    { codigo: 'PM10', total: 12, ultimo_valor: 20, ultima_leitura_em: minutosAtras(3) },
    { codigo: 'DIR-01', total: 4, ultimo_valor: 270, ultima_leitura_em: minutosAtras(25) },
    { codigo: 'TEMP-01', total: 12, ultimo_valor: 24.9, ultima_leitura_em: minutosAtras(3) },
  ],
  [estacoes[1].id]: [{ codigo: 'CHUVA-01', total: 2, ultimo_valor: 0.4, ultima_leitura_em: minutosAtras(90) }],
};

function filtrarAlarmes(params: Record<string, string | undefined> = {}): Alarme[] {
  return alarmes
    .filter((a) => !params.de || a.lido_em >= new Date(params.de).toISOString())
    .filter((a) => !params.ate || a.lido_em <= new Date(params.ate).toISOString())
    .filter((a) => !params.severidade || a.severidade === params.severidade)
    .filter((a) => !params.estacao_id || a.estacao_id === params.estacao_id)
    .filter((a) => !params.situacao || a.situacao === params.situacao)
    .sort((x, y) => y.lido_em.localeCompare(x.lido_em));
}

function resumoAlarmes() {
  const abertos: Record<SeveridadeAlarme, number> = { ATENCAO: 0, ALERTA: 0, CRITICO: 0 };
  for (const a of alarmes) if (a.situacao === 'aberto') abertos[a.severidade] += 1;
  return { abertos, total: abertos.ATENCAO + abertos.ALERTA + abertos.CRITICO };
}

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

    // Rotas de análise de dados.
  const seriesRoute = url.match(
    /^\/analise\/estacoes\/([^/]+)\/series$/,
  );

  if (method === 'get' && seriesRoute) {
    const estacaoId = seriesRoute[1];

    if (!estacoes.some((item) => item.id === estacaoId)) {
      return fail(404, 'Estação não encontrada.');
    }

    const params = config.params as
      | { grandeza?: string; periodo?: string }
      | undefined;

    const grandeza = params?.grandeza;
    const periodo = params?.periodo;

    if (!grandeza) {
      return fail(400, 'A grandeza é obrigatória.');
    }

    const periodosValidos: PeriodoAnalise[] = ['24h', '7d', '30d'];

    if (!periodo || !periodosValidos.includes(periodo as PeriodoAnalise)) {
      return fail(400, 'Período inválido.');
    }

    return response(
      criarMockSeries(estacaoId, grandeza, periodo as PeriodoAnalise),
    );
  }

  const ultimasLeiturasRoute = url.match(
    /^\/analise\/estacoes\/([^/]+)\/ultimas-leituras$/,
  );

  if (method === 'get' && ultimasLeiturasRoute) {
    const estacaoId = ultimasLeiturasRoute[1];

    if (!estacoes.some((item) => item.id === estacaoId)) {
      return fail(404, 'Estação não encontrada.');
    }

    return response(criarMockUltimasLeituras(estacaoId));
  }

  if (method === 'get' && url === '/analise/iqar') {
    return response(mockIqar);
  }

  if (method === 'get' && url === '/estacoes/status') return response({
    resumo: { total: 3, ativas: 1, com_falha: 1, inativas: 1 },
    estacoes,
  });
  if (method === 'get' && url === '/estacoes/tipos-sensor') return response(catalogo);
  // Mesmas regras da API (US-39): nome único, faixa coerente, unidade travada e exclusão só sem uso.
  const usaGrandeza = (nome: string) => sensores.some((item) => item.tipo === nome);
  const dadosDaGrandeza = (corpo: unknown) => (typeof corpo === 'string' ? JSON.parse(corpo) : corpo) as Record<string, unknown>;
  if (method === 'post' && url === '/estacoes/tipos-sensor') {
    const dados = dadosDaGrandeza(config.data);
    if (catalogo.some((item) => item.nome === dados.nome)) {
      return fail(409, `Já existe uma grandeza com o nome "${dados.nome}" no catálogo.`);
    }
    if (Number(dados.faixa_min) >= Number(dados.faixa_max)) {
      return fail(400, 'faixa_min deve ser menor que faixa_max.');
    }
    const criada = {
      id: crypto.randomUUID(),
      nome: String(dados.nome),
      unidade: String(dados.unidade),
      faixa_min: Number(dados.faixa_min).toFixed(2),
      faixa_max: Number(dados.faixa_max).toFixed(2),
      agregacao: (dados.agregacao ?? 'media') as string,
    };
    catalogo.push(criada as (typeof catalogo)[number]);
    return response(criada, 201);
  }
  const grandezaRoute = url.match(/^\/estacoes\/tipos-sensor\/([^/]+)$/);
  if (grandezaRoute && (method === 'put' || method === 'delete')) {
    const indice = catalogo.findIndex((item) => item.id === grandezaRoute[1]);
    if (indice < 0) return fail(404, 'Grandeza não encontrada no catálogo.');
    const atual = catalogo[indice];
    if (method === 'delete') {
      if (usaGrandeza(atual.nome)) {
        return fail(409, 'Esta grandeza é usada por sensores e não pode ser excluída.');
      }
      catalogo.splice(indice, 1);
      return response(null, 204);
    }
    const dados = dadosDaGrandeza(config.data);
    const unidadeMuda = dados.unidade !== undefined && dados.unidade !== atual.unidade;
    if (unidadeMuda && usaGrandeza(atual.nome)) {
      return fail(409, 'A unidade não pode ser alterada: esta grandeza já é usada por sensores.');
    }
    const min = dados.faixa_min !== undefined ? Number(dados.faixa_min) : Number(atual.faixa_min);
    const max = dados.faixa_max !== undefined ? Number(dados.faixa_max) : Number(atual.faixa_max);
    if (min >= max) return fail(400, 'faixa_min deve ser menor que faixa_max.');
    catalogo[indice] = {
      ...atual,
      unidade: dados.unidade !== undefined ? String(dados.unidade) : atual.unidade,
      faixa_min: min.toFixed(2),
      faixa_max: max.toFixed(2),
      agregacao: (dados.agregacao ?? atual.agregacao) as string,
    } as (typeof catalogo)[number];
    return response(catalogo[indice]);
  }
  // Os caminhos reais do gestao-estacoes: /estacoes/estacoes/:id/sensores e /estacoes/sensores/:id/status.
  const detectadosRoute = url.match(/^\/estacoes\/estacoes\/([^/]+)\/sensores\/detectados$/);
  if (method === 'get' && detectadosRoute) {
    const estacaoId = detectadosRoute[1];
    if (!estacoes.some((item) => item.id === estacaoId)) return fail(404, 'Estação não encontrada.');
    const cadastrados = new Set(sensores.filter((item) => item.estacao_id === estacaoId).map((item) => item.codigo));
    return response((recebidos[estacaoId] ?? []).filter((item) => !cadastrados.has(item.codigo)));
  }
  const collection = url.match(/^\/estacoes\/estacoes\/([^/]+)\/sensores$/);
  if (collection) {
    const estacaoId = collection[1];
    if (!estacoes.some((item) => item.id === estacaoId)) return fail(404, 'Estação não encontrada.');
    if (method === 'get') return response(sensores.filter((item) => item.estacao_id === estacaoId));
    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const grandeza = catalogo.find((item) => item.nome === body?.tipo);
      if (!grandeza) return fail(400, `Tipo de sensor "${String(body?.tipo)}" não existe no catálogo de grandezas.`);
      const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : '';
      const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
      if (!codigo || codigo.length > 30 || !nome || nome.length > 100) return fail(400, 'Código e nome são obrigatórios (máximo de 30 e 100 caracteres).');
      const unidadeLeitura = typeof body.unidade_leitura === 'string' ? body.unidade_leitura.trim() : '';
      if (unidadeLeitura.length > 20) return fail(400, 'A unidade da leitura aceita até 20 caracteres.');
      const tipo = grandeza.nome;
      if (sensores.some((item) => item.estacao_id === estacaoId && item.tipo === tipo)) return fail(409, `Esta estação já possui um sensor de ${tipo} cadastrado`);
      if (sensores.some((item) => item.estacao_id === estacaoId && item.codigo === codigo)) return fail(409, `Já existe um sensor com o código "${codigo}" nesta estação.`);
      const fatorConversao = body.fator_conversao ?? 1;
      const offset = body.offset ?? 0;
      if (![fatorConversao, offset].every((value) => typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 999999.999999)) return fail(400, 'Calibração inválida.');
      const sensor: MockSensor = { codigo, nome, id: crypto.randomUUID(), estacao_id: estacaoId, tipo, unidade_medida: grandeza.unidade, unidade_leitura: unidadeLeitura || null, fator_conversao: fatorConversao.toFixed(6), offset: offset.toFixed(6), status: 'Ativo' };
      sensores.push(sensor);
      return response(sensor, 201);
    }
  }
  const statusRoute = url.match(/^\/estacoes\/sensores\/([^/]+)\/status$/);
  if (method === 'patch' && statusRoute) {
    const sensor = sensores.find((item) => item.id === statusRoute[1]);
    if (!sensor) return fail(404, 'Sensor não encontrado.');
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    if (body?.status !== 'Ativo' && body?.status !== 'Inativo') return fail(400, 'Status inválido.');
    sensor.status = body.status;
    return response(sensor);
  }
  if (method === 'get' && url === '/alertas/alarmes') return response(filtrarAlarmes(config.params));
  if (method === 'get' && url === '/alertas/alarmes/resumo') return response(resumoAlarmes());
  const alarmeRoute = url.match(/^\/alertas\/alarmes\/([^/]+)$/);
  if (method === 'get' && alarmeRoute) {
    const encontrado = alarmes.find((item) => item.id === alarmeRoute[1]);
    if (!encontrado) return fail(404, 'Alarme não encontrado.');
    return response(encontrado);
  }
  return fail(404, 'Rota não mockada.');
};
