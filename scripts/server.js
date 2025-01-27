import { URL } from 'url';

console.log(process.cwd());

const { PORT } = process.env;
Bun.serve({
  fetch(req) {
    const _path = new URL(req.url).pathname; // eg: /a/b
    if (!_path.endsWith('.user.js'))
      return new Response(`Not found: ${_path}`, { status: 404 });
    const path = _path.replace('/proxy', '');
    if (_path !== path)
      return new Response(`Not impl: ${_path}`, { status: 404 });
    else return fetch(import.meta.resolve(`..${path}`));
  },
  port: PORT,
});
console.log(`http://127.0.0.1:${PORT}/`);
