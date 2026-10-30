import { spawn, spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

// Ejecuta los entrypoints reales, incluido el consumidor de consola.
const server = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
  env: { ...process.env, PORT: '0' }, stdio: ['ignore', 'pipe', 'pipe'],
});
try {
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('API no inicio en 10 segundos')), 10000);
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`API termino antes de iniciar: ${code}`)); });
    server.stdout.on('data', chunk => {
      const match = chunk.toString().match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) { clearTimeout(timer); resolve(match[0]); }
    });
  });
  console.log(`API real iniciada: ${url}`);
  for (const [id, expected] of [
    ['p-100', 'Teclado mecanico: Q249.90 - disponible: true'],
    ['p-404', 'El producto p-404 no existe'],
  ]) {
    const run = spawnSync(process.execPath, ['--import', 'tsx', 'src/consumer-cli.ts', id], {
      encoding: 'utf8', timeout: 15000, env: { ...process.env, API_URL: url },
    });
    if (run.error) throw run.error;
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout.trim(), expected);
    console.log(`Consumidor real ${id}: ${run.stdout.trim()}`);
  }
  console.log('SMOKE OK: API y CLI reales responden correctamente en los dos casos.');
} finally { server.kill(); }
