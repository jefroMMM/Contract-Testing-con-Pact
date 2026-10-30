import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const stripAnsi = value => value.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '');
const hash = value => createHash('sha256').update(value).digest('hex');
const summary = JSON.parse(await readFile('evidencias/resumen.json', 'utf8'));
if (summary.steps.length !== 4) throw new Error('Se requieren las cuatro etapas de demo');
const expectedNames = ['01-consumidor', '02-proveedor-compatible', '03-proveedor-incompatible', '04-proveedor-restaurado'];
for (const [i, step] of summary.steps.entries()) {
  const code = i === 2 ? 1 : 0;
  if (step.name !== expectedNames[i] || step.exitCode !== code || step.expectedExit !== code) {
    throw new Error('La secuencia no corresponde a consumidor OK, proveedor OK, fallo contractual y restauracion OK');
  }
}
const titles = ['Consumidor: dos pruebas aprobadas', 'Proveedor: compatibilidad inicial',
  'Proveedor: incompatibilidad detectada', 'Proveedor: compatibilidad restaurada'];
// Chromium se instala con npx playwright install chromium. Edge es alternativa local.
const browser = await chromium.launch(process.argv.includes('--edge') ? { channel: 'msedge' } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 }, deviceScaleFactor: 1 });
  for (const [index, step] of summary.steps.entries()) {
    if (hash(await readFile('pacts/ProductConsumer-ProductProvider.json')) !== step.contractSha256) {
      throw new Error('El contrato actual no corresponde a las evidencias');
    }
    const logBytes = await readFile(`evidencias/${step.name}.log`);
    if (hash(logBytes) !== step.logSha256) throw new Error(`Hash invalido: ${step.name}`);
    const stdout = stripAnsi(await readFile(`evidencias/${step.name}.stdout.log`, 'utf8'));
    const stderr = stripAnsi(await readFile(`evidencias/${step.name}.stderr.log`, 'utf8'));
    const combined = Buffer.concat([await readFile(`evidencias/${step.name}.stdout.log`), await readFile(`evidencias/${step.name}.stderr.log`)]);
    if (!combined.equals(logBytes)) throw new Error(`Canales originales inconsistentes: ${step.name}`);
    const date = new Date(step.startedAt).toLocaleString('es-GT', { timeZone: 'America/Guatemala', hour12: false });
    const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>${escape(titles[index])}</title>
<style>*{box-sizing:border-box}body{margin:0;padding:30px;background:#f1f5f9;color:#14263d;font:18px Arial}h1{font-size:27px;margin:0 0 12px}p{margin:9px 0;line-height:1.4}code{font:15px Consolas,monospace;overflow-wrap:anywhere}.badge{display:inline-block;background:${step.exitCode ? '#fff0da' : '#d8f3e6'};padding:8px 12px;border-radius:6px;font-weight:bold}.note{font-size:15px;color:#45566b}pre{background:white;border:1px solid #c9d3df;border-left:5px solid #327f91;padding:20px;font:18px/1.4 Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin-bottom:8px}details pre{font-size:13px}footer{font-size:13px;line-height:1.5;overflow-wrap:anywhere}</style>
<h1>${escape(titles[index])}</h1>
<p class="note">Captura del visor de registros originales de una ejecución real. No es una terminal nativa.</p>
<p>${escape(date)} · America/Guatemala · ${escape(summary.node)}</p>
<p class="badge">Código de salida real: ${step.exitCode} · esperado: ${step.expectedExit}</p>
<p><code>${escape(step.command)}</code></p>
<pre id="stdout">${escape(stdout)}</pre>
<footer>Fuente íntegra: ${escape(step.name)}.stdout.log · Solo se eliminan códigos ANSI de color al visualizar.<br>SHA-256 del contrato: ${step.contractSha256}<br>SHA-256 del registro combinado: ${step.logSha256}</footer>
<details><summary>stderr original (expandir para revisar)</summary><pre>${escape(stderr)}</pre></details></html>`;
    const file = resolve(`evidencias/${step.name}.html`);
    await writeFile(file, html);
    await page.goto(pathToFileURL(file).href);
    // La captura proviene del navegador; no se dibuja ni inventa salida de pruebas.
    await page.screenshot({ path: `evidencias/${step.name}.png`, fullPage: true });
    console.log(`Captura real del visor: evidencias/${step.name}.png`);
  }
} finally { await browser.close(); }
