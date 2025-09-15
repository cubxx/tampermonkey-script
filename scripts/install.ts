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
  let hasClosed = false;
  const readStream = createReadStream(from).on('error', p.reject);
  const writeStream = createWriteStream(to, { flags: 'w' })
    .on('drain', () => rl.resume())
    .on('close', () => p.resolve())
    .on('error', p.reject);
  const rl = createInterface({ input: readStream, crlfDelay: Infinity })
    .on('line', (line) => {
      if (hasClosed) return;
      if (line.startsWith('// ==/UserScript==')) {
        hasClosed = true;
        rl.close();
        writeStream.end(line);
        return;
      }
      // process each line
      const newLine = line.startsWith('// @updateURL')
        ? ''
        : line.replace(
            /^\/\/ @((?:downloadURL|require) +)(\/.+)$/,
            (_, chars, link: string) =>
              '// @' +
              'require'.padEnd(chars.length) +
              `http://localhost:${port}${link}`,
          );
      if (newLine === '') return;
      const canWrite = writeStream.write(`${newLine}\n`);
      if (!canWrite) rl.pause();
    })
    .on('error', p.reject);
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
  if (
    true
    // !(await fs.exists(distPath)) ||
    // confirm(`File ${distPath} exists. Overwrite?`)
  ) {
    await mvMeta(srcPath, distPath, port);
  }
  openUrl(browser, distPath);
}
