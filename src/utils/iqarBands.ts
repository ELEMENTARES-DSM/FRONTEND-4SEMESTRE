export interface IqarBandInfo {
  key: "boa" | "moderada" | "ruim" | "muito_ruim" | "pessima";
  label: string;
  range: string;
  color: string;
  bg: string;
}

export const IQAR_BANDS: IqarBandInfo[] = [
  {
    key: "boa",
    label: "Boa",
    range: "0–15",
    color: "#22C55E",
    bg: "#22C55E1F",
  },
  {
    key: "moderada",
    label: "Moderada",
    range: "16–50",
    color: "#EAB308",
    bg: "#EAB3081F",
  },
  {
    key: "ruim",
    label: "Ruim",
    range: "51–75",
    color: "#F97316",
    bg: "#F973161F",
  },
  {
    key: "muito_ruim",
    label: "Muito Ruim",
    range: "76–125",
    color: "#EF4444",
    bg: "#EF44441F",
  },
  {
    key: "pessima",
    label: "Péssima",
    range: "126+",
    color: "#A855F7",
    bg: "#A855F71F",
  },
];
