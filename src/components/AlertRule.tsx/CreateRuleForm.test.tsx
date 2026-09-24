// @vitest-environment jsdom
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CreateRuleForm } from "./CreateRuleForm";
import type { EstacaoOption } from "../../types/alerts";

// Mock do Lucide Icons para prevenir erros em ambiente de teste JSDOM
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...actual,
    AlertTriangle: () => <span data-testid="alert-icon" />,
    CheckCircle: () => <span data-testid="check-icon" />,
    X: () => <span data-testid="x-icon" />,
    Info: () => <span data-testid="info-icon" />,
  };
});

// Dados Mock de estações e sensores para os testes de seleção (RN-01)
const mockEstacoes: EstacaoOption[] = [
  {
    id: "est-01",
    nome: "EST-SJC-001 (Zona Leste)",
    sensores: [
      { id: "sns-01", nome: "Sensor de Chuva", unidadeMedida: "mm/h" },
      { id: "sns-02", nome: "PM2.5", unidadeMedida: "µg/m³" },
    ],
  },
];

describe("CreateRuleForm - US-06 (Configuração de Regras de Alerta)", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("deve renderizar os campos básicos do formulário de criação de regra", () => {
    render(
      <CreateRuleForm
        estacoes={mockEstacoes}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByLabelText(/nome da regra/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sensor \/ grandeza/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/operador/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valor limite/i)).toBeInTheDocument();
  });

  it("deve manter o campo de sensores desativado até que uma estação seja selecionada", () => {
    render(
      <CreateRuleForm
        estacoes={mockEstacoes}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const selectSensor = screen.getByLabelText(/sensor \/ grandeza/i);
    expect(selectSensor).toBeDisabled();

    // Seleciona a Estação
    const selectEstacao = screen.getByLabelText(/estação/i);
    fireEvent.change(selectEstacao, { target: { value: "est-01" } });

    // Após selecionar a estação, o select de sensor deve ser liberado
    expect(selectSensor).not.toBeDisabled();
  });

  it("deve validar e submeter com sucesso uma nova regra válida (CA-001 / RN-02 / RN-03)", async () => {
    render(
      <CreateRuleForm
        estacoes={mockEstacoes}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    // 1. Preenche Nome
    fireEvent.change(screen.getByLabelText(/nome da regra/i), {
      target: { value: "Chuva Intensa - Centro" },
    });

    // 2. Seleciona Estação e Sensor (Chuva)
    fireEvent.change(screen.getByLabelText(/estação/i), {
      target: { value: "est-01" },
    });
    fireEvent.change(screen.getByLabelText(/sensor \/ grandeza/i), {
      target: { value: "sns-01" },
    });

    // 3. Preenche Operador (>=) e Valor Limite (50.00) conforme CA-001
    fireEvent.change(screen.getByLabelText(/operador/i), {
      target: { value: ">=" },
    });
    fireEvent.change(screen.getByLabelText(/valor limite/i), {
      target: { value: "50.00" },
    });

    // 4. Seleciona Severidade CRITICO
    const buttonCritico = screen.getByRole("button", { name: /crítico/i });
    fireEvent.click(buttonCritico);

    // 5. Envia o formulário
    const submitBtn = screen.getByRole("button", { name: /salvar regra/i });
    fireEvent.click(submitBtn);

    // Verifica se a função de envio foi chamada com o payload exigido na US-06
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        nome: "Chuva Intensa - Centro",
        sensor_id: "sns-01",
        operador: ">=",
        valor_limite: 50,
        severidade: "CRITICO",
        esta_ativo: true,
      });
    });
  });

  it("deve exibir o preview dinâmico da regra quando o sensor e o valor forem preenchidos", () => {
    render(
      <CreateRuleForm
        estacoes={mockEstacoes}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    // Seleciona Estação e Sensor
    fireEvent.change(screen.getByLabelText(/estação/i), {
      target: { value: "est-01" },
    });
    fireEvent.change(screen.getByLabelText(/sensor \/ grandeza/i), {
      target: { value: "sns-01" },
    });

    // Preenche valor
    fireEvent.change(screen.getByLabelText(/valor limite/i), {
      target: { value: "50" },
    });

    // Verifica a renderização do gatilho dinamico
    expect(screen.getByText(/dispara quando/i)).toBeInTheDocument();

    // Como o texto "Sensor de Chuva" aparece tanto no <option> quanto no preview dinâmico,
    // usamos getAllByText e pegamos o segundo elemento (índice 1), que é o preview:
    const elementosSensor = screen.getAllByText(/sensor de chuva/i);
    expect(elementosSensor[1]).toBeInTheDocument();
  });

  it("deve disparar a callback de cancelamento ao clicar no botão Cancelar", () => {
    render(
      <CreateRuleForm
        estacoes={mockEstacoes}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />,
    );

    const cancelBtn = screen.getByRole("button", { name: /cancelar/i });
    fireEvent.click(cancelBtn);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
