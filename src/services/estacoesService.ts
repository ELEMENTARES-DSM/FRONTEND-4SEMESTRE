import api from "../api/instance";

export interface EstacaoStatus {
  id: string;
  codigo: string;
  nome: string;
  municipio?: string;
  status_operacional: "Ativa" | "Com Falha" | "Inativa";
  ultimo_ping: string | null;
  minutos_sem_sinal: number | null;
  iqar?: number | null;
}

export interface ResumoEstacoes {
  total: number;
  ativas: number;
  com_falha: number;
  inativas: number;
}

interface StatusEstacoesResponse {
  resumo: ResumoEstacoes;
  estacoes: (Omit<EstacaoStatus, "minutos_sem_sinal"> & {
    iqar_atual?: number | null;
  })[];
}

export interface VisaoGeralData {
  resumo: ResumoEstacoes;
  estacoes: EstacaoStatus[];
}

export async function getVisaoGeralEstacoes(): Promise<VisaoGeralData> {
  const response = await api.get<StatusEstacoesResponse>("/estacoes/status");
  const agora = Date.now();

  const estacoes = response.data.estacoes.map((estacao) => {
    const ultimoPing = estacao.ultimo_ping ? Date.parse(estacao.ultimo_ping) : NaN;
    return {
      ...estacao,
      iqar: estacao.iqar ?? estacao.iqar_atual ?? null,
      minutos_sem_sinal: Number.isFinite(ultimoPing)
        ? Math.max(0, Math.floor((agora - ultimoPing) / 60000))
        : null,
    };
  });

  return {
    resumo: response.data.resumo,
    estacoes,
  };
}

export async function getEstacoesStatus(): Promise<EstacaoStatus[]> {
  const { estacoes } = await getVisaoGeralEstacoes();
  return estacoes;
}