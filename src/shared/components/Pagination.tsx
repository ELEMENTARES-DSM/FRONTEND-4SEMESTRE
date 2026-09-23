import { Icon } from "./Icon";
import { Select } from "./Field";
interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: Props) {
  const last = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: last }, (_, i) => i + 1).filter(
    (n) => last <= 7 || n === 1 || n === last || Math.abs(n - page) <= 1,
  );
  const buttonClass =
    "flex h-8 min-w-8 items-center justify-center gap-1 rounded-md border border-line px-2 text-[13px] text-muted transition hover:border-primary hover:text-primary hover:-translate-y-px active:scale-95 disabled:cursor-not-allowed disabled:text-line disabled:hover:translate-y-0 disabled:hover:border-line";
  return (
    <nav
      aria-label="Paginação de usuários"
      className="flex flex-wrap items-center justify-between gap-2.5 py-3.5 sm:border-t sm:border-line sm:px-5"
    >
      <div className="hidden items-center gap-2.5 sm:flex">
        <span className="text-[13px] text-muted">
          Exibindo{" "}
          <span className="text-base-content">
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}
          </span>{" "}
          de <span className="text-base-content">{total}</span> itens
        </span>
        <Select
          aria-label="Usuários por página"
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="rounded-md py-1 text-[13px]"
        >
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} por página
            </option>
          ))}
        </Select>
      </div>
      <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-end">
        <button
          aria-label="Página anterior"
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <Icon name="left" />
          <span className="text-xs sm:hidden">Anterior</span>
        </button>
        <span className="text-xs text-muted sm:hidden">
          Página <strong className="text-base-content">{page}</strong> de {last}
        </span>
        <div className="hidden gap-1 sm:flex">
          {pages.map((n, i) => (
            <span key={n} className="flex items-center gap-1">
              {i > 0 && n - pages[i - 1] > 1 && (
                <span className="px-1 text-muted">…</span>
              )}
              <button
                aria-label={`Página ${n}`}
                aria-current={n === page ? "page" : undefined}
                onClick={() => onPage(n)}
                className={`${buttonClass} ${n === page ? "border-primary bg-primary/15 font-semibold text-primary" : ""}`}
              >
                {n}
              </button>
            </span>
          ))}
        </div>
        <button
          aria-label="Próxima página"
          className={buttonClass}
          disabled={page >= last}
          onClick={() => onPage(page + 1)}
        >
          <span className="text-xs sm:hidden">Próxima</span>
          <Icon name="right" />
        </button>
      </div>
    </nav>
  );
}
