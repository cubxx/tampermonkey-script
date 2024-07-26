import fs from 'fs/promises';

function modify(code) {
  const exports = [];
  const newCode = code
    .replace(/export\{(.+)\}/, (_, g1) => {
      exports.push(
        ...g1.split(',').map((e) => e.split(' as ').reverse().join(':')),
      );
      return '';
    })
    .replace(/export default (.+);/, (_, g1) => {
      exports.push(`default:${g1}`);
      return '';
    });
  return `${newCode}\nreturn {${exports.join(',')}};`;
}
await fs.mkdir('lib', { recursive: true });
const libs = [
  ['lit', 'lit-html', 'https://cdn.jsdelivr.net/npm/lit-html@3.2.1'],
  ['sober', 'sober', 'https://cdn.jsdelivr.net/npm/sober@0.2.1/+esm'],
];
libs.forEach(async ([name, pkg, url]) => {
  const code = await fetch(url).then((e) => e.text());
  fs.writeFile(
    `lib/${name}.js`,
    `/**@type {import('${pkg}')}*/const ${name}=window['${name}']=(()=>{\n${modify(code)}\n})();`,
  );
});
