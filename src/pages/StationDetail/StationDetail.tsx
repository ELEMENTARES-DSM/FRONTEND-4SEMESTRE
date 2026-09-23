import { SensorCreateModal } from "../../components/SensorsTable/SensorCreateModal";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getSensoresByEstacao,
  updateSensorStatus,
  type Sensor,
} from "../../services/sensoresService";

import { Button } from "../../shared/components/Button";
import { SensorsTable } from "../../components/SensorsTable/SensorsTable";
import { SensorsTableSkeleton } from "../../components/SensorsTable/SensorsTableSkeleton";

export function StationDetails() {
  const { estacaoId } = useParams();
  return <StationSensors key={estacaoId} estacaoId={estacaoId} />;
}

function StationSensors({ estacaoId }: { estacaoId?: string }) {
  const navigate = useNavigate();
  const [modalAberto, setModalAberto] = useState(false);
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const pendingIds = useRef(new Set<string>());
  const [reload, setReload] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    async function carregarSensores() {
      if (!estacaoId) {
        setLoading(false);
        setLoadFailed(true);
        setErro("Estação não informada.");
        return;
      }

      try {
        setLoading(true);
        setErro(null);
        setLoadFailed(false);

        const data = await getSensoresByEstacao(estacaoId);

        if (active) setSensores(data);
      } catch (error) {
        console.error("Erro ao carregar sensores:", error);

        if (active) {
          setLoadFailed(true);
          setErro("Não foi possível carregar os sensores.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    carregarSensores();
    return () => { active = false; };
  }, [estacaoId, reload]);

  async function handleToggleStatus(sensor: Sensor) {
    if (pendingIds.current.has(sensor.id)) return;
    pendingIds.current.add(sensor.id);
    setUpdatingIds([...pendingIds.current]);
    setErro(null);
    const novoStatus =
      sensor.status === "Ativo" ? "Inativo" : "Ativo";

    try {
      await updateSensorStatus(sensor.id, novoStatus);

      setSensores((sensoresAtuais) =>
        sensoresAtuais.map((item) =>
          item.id === sensor.id
            ? {
                ...item,
                status: novoStatus,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status do sensor:",
        error,
      );

      setErro(
        "Não foi possível alterar o status do sensor.",
      );
    } finally {
      pendingIds.current.delete(sensor.id);
      setUpdatingIds([...pendingIds.current]);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1120] p-6 text-base-content">
      <div className="mx-auto max-w-7xl">
        <Button className="mb-4" onClick={() => navigate("/platform")}>← Voltar às estações</Button>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Sensores da Estação
            </h1>

            <p className="text-sm text-muted">
              Sensores associados à estação meteorológica.
            </p>
          </div>

          <Button
            variant="primary"
            disabled={!estacaoId || loading}
            onClick={() => setModalAberto(true)}
          >
            + Adicionar Sensor
          </Button>
        </div>

        {erro && (
          <div role="alert" className="mb-4 rounded-lg border border-error/40 bg-error/10 p-3.5 text-[13px] text-error">
            <span>{erro}</span>
          </div>
        )}

        {loading ? (
          <SensorsTableSkeleton />
        ) : loadFailed ? (
          <Button variant="outline" onClick={() => setReload((value) => value + 1)}>Tentar novamente</Button>
        ) : (
          <SensorsTable
            sensores={sensores}
            updatingIds={updatingIds}
            onToggleStatus={handleToggleStatus}
          />
        )}
        {modalAberto && estacaoId && (
          <SensorCreateModal
            estacaoId={estacaoId}
            onClose={() => setModalAberto(false)}
            onCreated={(sensor) => {
              setSensores((atuais) => [...atuais.filter((item) => item.id !== sensor.id), sensor]);
              setModalAberto(false);
              setErro(null);
              if (loadFailed) setReload((value) => value + 1);
            }}
          />
        )}
      </div>
    </main>
  );
}