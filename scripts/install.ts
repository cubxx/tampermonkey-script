import { exec } from 'child_process';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import path from 'path';
import { createInterface } from 'readline';

function prompt(msg: string) {
  const result = globalThis.prompt(msg);
  if (result === null) throw new Error('User cancelled');
  return result;
}
const tasks = {
  async mv_meta(port = prompt('Enter your local server port:')) {
    const src = path.resolve('src');
    const dist = path.resolve('dist');
    for await (const item of await fs.opendir(src)) {
      if (item.isDirectory() || !item.name.endsWith('.user.js')) continue;
      const from = path.join(src, item.name);
      const to = path.join(dist, item.name);
      await fs.mkdir(dist, { recursive: true });

      // move metadata to new file
      let hasClosed = false;
      const readStream = createReadStream(from).on('error', (err) =>
        console.error('Read error:', err),
      );
      const writeStream = createWriteStream(to, { flags: 'w' })
        .on('drain', () => rl.resume())
        .on('close', () => console.log(`Metadata moved to ${to}`))
        .on('error', (err) => console.error('Write error:', err));
      const rl = createInterface({ input: readStream, crlfDelay: Infinity }).on(
        'line',
        (line) => {
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
                /^\/\/ @((?:downloadURL|require) +)(.+)$/,
                (_, chars, link: string) =>
                  '// @' +
                  'require'.padEnd(chars.length) +
                  `http://localhost:${port}/` +
                  link.split('/').slice(-2).join('/'),
              );
          if (newLine === '') return;
          const canWrite = writeStream.write(`${newLine}\n`);
          if (!canWrite) rl.pause();
        },
      );
    }
    return dist;
  },
  async install(dir = prompt('Enter the directory to install:')) {
    const browser = prompt('Enter the browser to use:');
    for await (const item of await fs.opendir(dir)) {
      if (item.isFile() && item.name.endsWith('.user.js')) {
        const p = exec(`${browser} file://${path.join(dir, item.name)}`);
        p.stdout?.pipe(process.stdout);
        p.stderr?.pipe(process.stderr);
      }
    }
  },
};

console.log('Please start a local file server to ' + process.cwd());
const [, , cmd, ...rest] = process.argv;
const cmds = Object.keys(tasks);
if (!cmd) tasks.install(await tasks.mv_meta());
else if (cmds.includes(cmd)) tasks[cmd](...rest);
else console.error(`Invalid command: ${cmd}, expected one of ${cmds}`);
