interface KpiCardsProps {
  total: number;
  ativas: number;
  comFalha: number;
  inativas: number;
}

export function KpiCards({
  total,
  ativas,
  comFalha,
  inativas,
}: KpiCardsProps) {
  const cards = [
    {
      key: "total",
      label: "Total de estações",
      value: total,
      description: "Inventário monitorado",
      color: "#14B8A6",
      icon: (
        <>
          <circle cx="10" cy="10" r="2" />
          <path d="M6 6a5.7 5.7 0 0 0 0 8M14 6a5.7 5.7 0 0 1 0 8M3 3a10 10 0 0 0 0 14M17 3a10 10 0 0 1 0 14" />
        </>
      ),
    },
    {
      key: "ativas",
      label: "Ativas",
      value: ativas,
      description: "Transmitindo normalmente",
      color: "#22C55E",
      icon: (
        <>
          <path d="m5 10 3 3 7-7" />
          <circle cx="10" cy="10" r="8" />
        </>
      ),
    },
    {
      key: "falha",
      label: "Com falha",
      value: comFalha,
      description: "Exigem atenção",
      color: "#EF4444",
      icon: (
        <>
          <path d="M10 6v5M10 14v.5" />
          <path d="M10 2 2 18h16L10 2Z" />
        </>
      ),
    },
    {
      key: "inativas",
      label: "Inativas",
      value: inativas,
      description: "Fora de operação",
      color: "#94A3B8",
      icon: (
        <>
          <circle cx="10" cy="10" r="8" />
          <path d="m5 5 10 10" />
        </>
      ),
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const widthPct =
            total > 0 ? Math.max(20, (card.value / total) * 100) : 0;

          return (
            <div
              key={card.key}
              data-testid={`card-${card.key}`}
              className="relative overflow-hidden rounded-2xl border border-line bg-[#111C38] p-5 shadow"
            >
              <div
                className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full blur-3xl"
                style={{ backgroundColor: `${card.color}1A` }}
              />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    {card.label}
                  </span>
                  <strong className="mt-2 block text-3xl font-bold text-slate-100">
                    {card.value}
                  </strong>
                  <span className="mt-1.5 block text-[11px] text-gray-400">
                    {card.description}
                  </span>
                </div>

                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${card.color}1A`,
                    color: card.color,
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {card.icon}
                  </svg>
                </div>
              </div>

              <div
                className="absolute bottom-0 left-0 h-0.5 transition-all duration-300"
                style={{ backgroundColor: card.color, width: `${widthPct}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400">
        <span className="text-green-400">{ativas} ativas</span>
        <span>+</span>
        <span className="text-red-400">{comFalha} com falha</span>
        <span>+</span>
        <span>{inativas} inativas</span>
        <span>=</span>
        <span className="font-semibold text-slate-200">{total} no total</span>
      </div>
    </div>
  );
}