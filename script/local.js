import fs from 'fs/promises';
import path from 'path';

/** @param {string} dir @param {(path: string, name: string) => void} callback */
async function walkFile(dir, callback) {
    for await (const dirEntry of await fs.opendir(dir)) {
        const entryPath = path.join(dir, dirEntry.name);
        if (dirEntry.isDirectory()) {
            await walkFile(entryPath);
        } else {
            callback(entryPath, dirEntry.name);
        }
    }
}
/** @param {string} dir */
function makedirs(dir) {
    return fs.access(dir).catch(() => fs.mkdir(dir, { recursive: true }));
}
/** @param {string} text */
function getMetadata(text) {
    const lines = text.split('\n');
    if (lines[0] !== '// ==UserScript==') {
        return;
    }
    /** @type {string[]} */
    const metadata = [];
    metadata.push(lines[0]);
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line === '// ==/UserScript==') {
            metadata.push(line);
            return metadata.join('\n');
        }
        const match = line.match(/^\/\/ @(.+?) +(.+)$/);
        if (match) {
            metadata.push(line);
        } else {
            return;
        }
    }
}
function main() {
    const workspaceURL = 'file:///' + process.cwd().replaceAll(path.sep, '/');
    const src = 'src';
    const dest = 'local';
    makedirs(dest);
    walkFile(src, async (filepath, filename) => {
        const text = await fs.readFile(filepath, 'utf-8');
        const metadata = getMetadata(text);
        if (metadata) {
            const newMetadata = metadata
                .replaceAll(
                    'https://github.com/Cubxx/tampermonkey-script/raw/main',
                    workspaceURL,
                )
                .replace(
                    /\/\/ @updateURL[^\n]+\n\/\/ @downloadURL/,
                    '// @require',
                );
            fs.writeFile(path.join(dest, filename), newMetadata);
        } else {
            console.log("can't get metadata", filepath);
        }
    });
}
main();
