import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const examplePath = path.join(root, ".env.example");
const envPath = path.join(root, ".env");

function parseEnvFile(filePath) {
  const vars = {};
  if (!fs.existsSync(filePath)) return vars;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    vars[key] = value;
  }
  return vars;
}

if (!fs.existsSync(examplePath)) {
  console.error("ERRO: .env.example não encontrado.");
  process.exit(1);
}

const requiredKeys = Object.keys(parseEnvFile(examplePath)).filter((k) =>
  k.startsWith("VITE_")
);
const fileEnv = parseEnvFile(envPath);
const missing = [];

for (const key of requiredKeys) {
  const val = process.env[key] ?? fileEnv[key];
  if (val === undefined || val === "") {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error(
    `ERRO: Variáveis VITE_* obrigatórias ausentes (.env ou ambiente): ${missing.join(", ")}`
  );
  process.exit(1);
}

console.log(
  `OK: Todas as ${requiredKeys.length} variáveis VITE_* de .env.example estão definidas (${requiredKeys.join(", ")}).`
);
