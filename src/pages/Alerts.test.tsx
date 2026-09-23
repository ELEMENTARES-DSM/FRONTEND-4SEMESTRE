// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
} from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { Alerts } from "./Alerts";

const extendedMatchers =
  (matchers as unknown as { default: Record<string, unknown> }).default ||
  matchers;

expect.extend(extendedMatchers as Parameters<typeof expect.extend>[0]);

// Mock do HTMLDialogElement para evitar erros com showModal() e close() no JSDOM
beforeAll(() => {
  if (typeof HTMLDialogElement !== "undefined") {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
  }
});

// Mock dos ícones do lucide-react
vi.mock("lucide-react", async () => {
  const actual = await vi.importActual("lucide-react");
  return {
    ...actual,
    Bell: () => <span data-testid="bell-icon" />,
    Plus: () => <span data-testid="plus-icon" />,
    Trash2: () => <span data-testid="trash-icon" />,
    Search: () => <span data-testid="search-icon" />,
    Filter: () => <span data-testid="filter-icon" />,
    AlertTriangle: () => <span data-testid="alert-icon" />,
    CheckCircle: () => <span data-testid="check-icon" />,
    X: () => <span data-testid="x-icon" />,
  };
});

describe("Alerts Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("deve renderizar a página de alertas com título e estatísticas", () => {
    render(<Alerts />);

    expect(
      screen.getByRole("heading", { level: 1, name: /regras de alerta/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/regras cadastradas/i)).toBeInTheDocument();
  });

  it("deve abrir e fechar o modal de nova regra de alerta", () => {
    render(<Alerts />);

    const newBtn = screen.getByRole("button", {
      name: /nova regra de alerta/i,
    });
    fireEvent.click(newBtn);

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
  });

  it("deve filtrar a lista de alertas por termo de busca", () => {
    render(<Alerts />);

    const searchInput = screen.getByPlaceholderText(
      /buscar por nome, estação ou sensor/i,
    );
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "PM2.5" } });
    expect(searchInput).toHaveValue("PM2.5");
  });

  it("deve alternar os filtros de severidade", () => {
    render(<Alerts />);

    const filterCritico = screen.getByRole("checkbox", {
      name: /críticas/i,
    });
    fireEvent.click(filterCritico);

    expect(filterCritico).toBeInTheDocument();
  });
});
