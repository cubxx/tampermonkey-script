import { Glob } from 'bun';
import { exec } from 'node:child_process';
import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline';

function prompt(msg: string, defaultValue?: string) {
  const result = globalThis.prompt(
    ...(defaultValue ? [msg, defaultValue] : [msg]),
  );
  if (result === null) throw new Error('User cancelled');
  return result;
}
function mvMeta(from: string, to: string, port: string) {
  const p = Promise.withResolvers<void>();
  const readStream = createReadStream(from).on('error', p.reject);
  const writeStream = createWriteStream(to, { flags: 'w' })
    .once('finish', p.resolve)
    .on('error', p.reject);

  let done = false;
  const rl = createInterface({ input: readStream, crlfDelay: Infinity })
    .on('line', (line) => {
      if (done) return;
      if (line.startsWith('// ==/UserScript==')) {
        writeStream.write(
          `// @require  http://127.0.0.1:${port}/${path.basename(to)}\n`,
        );
        writeStream.write(line + '\n');
        writeStream.end();
        rl.close();
        done = true;
        return;
      }
      writeStream.write(line + '\n');
    })
    .on('error', (err) => writeStream.destroy(err));
  return p.promise;
}
function openUrl(browser: string, filepath: string) {
  const p = exec(`${browser} file://${filepath}`);
  p.stdout?.pipe(process.stdout);
  p.stderr?.pipe(process.stderr);
}

const src = path.join(import.meta.dir, '../src');
const dist = path.join(import.meta.dir, '../dist');
(await fs.exists(dist)) || (await fs.mkdir(dist, { recursive: true }));

const scripts = (
  await Array.fromAsync(new Glob('*.user.js').scan({ cwd: src }))
).sort();
const targets = prompt(
  scripts.reduceRight(
    (acc, e, i) => '\n' + (i + 1) + ' ' + e.replace('.user.js', '') + acc,
    '\nEnter the target file indexes (comma-separated):',
  ),
)
  .split(',')
  .map((e) => scripts[+e - 1]);

const port = prompt('Enter your local server port:', '3010');
const browser = prompt('Enter the browser to use:', 'firefox');

for (const target of targets) {
  const srcPath = path.join(src, target);
  const distPath = path.join(dist, target);
  await mvMeta(srcPath, distPath, port);
  openUrl(browser, distPath);
}
