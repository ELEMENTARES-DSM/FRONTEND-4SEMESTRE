import api from "../api/instance";

export interface EstacaoStatus {
  id: string;
  codigo: string;
  nome: string;
  municipio?: string;
  status_operacional: "Ativa" | "Com Falha" | "Inativa";
  ultimo_ping: string | null;
  minutos_sem_sinal: number | null;
}

interface StatusEstacoesResponse {
  resumo: { total: number; ativas: number; com_falha: number; inativas: number };
  estacoes: Omit<EstacaoStatus, "minutos_sem_sinal">[];
}

export async function getEstacoesStatus(): Promise<EstacaoStatus[]> {
  const response = await api.get<StatusEstacoesResponse>("/estacoes/status");
  const agora = Date.now();

  return response.data.estacoes.map((estacao) => {
    const ultimoPing = estacao.ultimo_ping ? Date.parse(estacao.ultimo_ping) : NaN;
    return {
      ...estacao,
      minutos_sem_sinal: Number.isFinite(ultimoPing)
        ? Math.max(0, Math.floor((agora - ultimoPing) / 60000))
        : null,
    };
  });
}
