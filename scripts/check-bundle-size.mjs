import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve(import.meta.dirname, "..");
const assetsDir = path.join(root, "dist", "assets");
const warnChunkKb = Number(process.env.BUNDLE_WARN_CHUNK_KB || 500);

if (!fs.existsSync(assetsDir)) {
  console.error("ERRO: dist/assets não encontrado. Execute npm run build antes.");
  process.exit(1);
}

const files = fs
  .readdirSync(assetsDir)
  .filter((f) => /\.(js|css)$/.test(f))
  .map((name) => {
    const full = path.join(assetsDir, name);
    const buf = fs.readFileSync(full);
    const gzip = zlib.gzipSync(buf).length;
    return {
      name,
      rawKb: +(buf.length / 1024).toFixed(2),
      gzipKb: +(gzip / 1024).toFixed(2),
    };
  })
  .sort((a, b) => b.rawKb - a.rawKb);

const totalRawKb = +files.reduce((acc, f) => acc + f.rawKb, 0).toFixed(2);
const totalGzipKb = +files.reduce((acc, f) => acc + f.gzipKb, 0).toFixed(2);

console.log("=== Relatório de tamanho de bundle (dist/assets) ===");
for (const f of files) {
  const flag = f.name.endsWith(".js") && f.rawKb > warnChunkKb ? " [ALERTA > " + warnChunkKb + " kB]" : "";
  console.log(`- ${f.name}: ${f.rawKb} kB (gzip: ${f.gzipKb} kB)${flag}`);
}
console.log(`Total: ${totalRawKb} kB (gzip: ${totalGzipKb} kB)`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    "### Tamanho do Bundle (`dist/assets`)",
    "",
    "| Arquivo | Raw (kB) | Gzip (kB) |",
    "|---|---:|---:|",
    ...files.map((f) => `| \`${f.name}\` | ${f.rawKb} | ${f.gzipKb} |`),
    `| **Total** | **${totalRawKb}** | **${totalGzipKb}** |`,
    "",
  ];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n"));
}
