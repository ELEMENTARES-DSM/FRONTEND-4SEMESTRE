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
    range: "0–40",
    color: "#22C55E",
    bg: "#22C55E1F",
  },
  {
    key: "moderada",
    label: "Moderada",
    range: "41–80",
    color: "#FACC15",
    bg: "#FACC151F",
  },
  {
    key: "ruim",
    label: "Ruim",
    range: "81–120",
    color: "#FB923C",
    bg: "#FB923C1F",
  },
  {
    key: "muito_ruim",
    label: "Muito Ruim",
    range: "121–199",
    color: "#EF4444",
    bg: "#EF44441F",
  },
  {
    key: "pessima",
    label: "Péssima",
    range: "200+",
    color: "#A855F7",
    bg: "#A855F71F",
  },
];

export function getIqarBand(iqar: number): IqarBandInfo {
  if (iqar <= 40) return IQAR_BANDS[0];
  if (iqar <= 80) return IQAR_BANDS[1];
  if (iqar <= 120) return IQAR_BANDS[2];
  if (iqar < 200) return IQAR_BANDS[3];
  return IQAR_BANDS[4];
}
