import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

await mkdir('evidencias', { recursive: true });
const contract = 'pacts/ProductConsumer-ProductProvider.json';
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const steps = [
  ['01-consumidor', ['scripts/clean-contract.mjs'], ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/consumer.pact.test.ts'], 0],
  ['02-proveedor-compatible', null, ['--import', 'tsx', 'tests/verify-provider.ts'], 0],
  ['03-proveedor-incompatible', null, ['--import', 'tsx', 'tests/verify-provider.ts', '--incompatible'], 1],
  ['04-proveedor-restaurado', null, ['--import', 'tsx', 'tests/verify-provider.ts'], 0],
];
const summary = { startedAt: new Date().toISOString(), node: process.version, steps: [] };
let contractHash;
for (const [name, preparation, args, expectedExit] of steps) {
  if (preparation) {
    const pre = spawnSync(process.execPath, preparation, { encoding: 'utf8' });
    if (pre.status !== 0) throw new Error(pre.stderr || 'No se pudo preparar el contrato');
  }
  const startedAt = new Date().toISOString();
  const run = spawnSync(process.execPath, args, {
    encoding: 'utf8', timeout: 120000, maxBuffer: 10 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0', PACT_DO_NOT_TRACK: 'true' },
  });
  // Salidas originales separadas; el log combinado conserva stdout y luego stderr.
  const stdout = run.stdout ?? '';
  const stderr = run.stderr ?? '';
  const log = `${stdout}${stderr}`;
  await writeFile(`evidencias/${name}.stdout.log`, stdout);
  await writeFile(`evidencias/${name}.stderr.log`, stderr);
  await writeFile(`evidencias/${name}.log`, log);
  const currentHash = await hash(contract);
  contractHash ??= currentHash;
  const record = { name, command: `node ${args.join(' ')}`, startedAt,
    finishedAt: new Date().toISOString(), exitCode: run.status, expectedExit,
    contractSha256: currentHash, logSha256: await hash(`evidencias/${name}.log`) };
  summary.steps.push(record);
  await writeFile('evidencias/resumen.json', JSON.stringify(summary, null, 2) + '\n');
  console.log(`\n=== ${name} | salida ${run.status} (esperada ${expectedExit}) ===\n${log}`);
  if (run.error) throw run.error;
  if (run.status !== expectedExit) throw new Error(`Resultado inesperado en ${name}`);
  if (contractHash !== currentHash) throw new Error('El contrato cambio durante la verificacion');
  if (expectedExit === 1 && !/"path":"\$\.price","type":"BodyMismatch"/.test(log)) {
    throw new Error('El fallo no corresponde al mismatch contractual de $.price');
  }
}
console.log('DEMOSTRACION COMPLETA: consumidor OK; proveedor OK -> fallo real -> restaurado OK. Contrato sin cambios.');
