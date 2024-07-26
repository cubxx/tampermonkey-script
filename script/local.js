import { exec } from 'child_process';
import fs from 'fs/promises';
import p from 'path';

/** @param {string} dir @param {(path: string, name: string) => void} callback */
async function walkFile(dir, callback) {
    for await (const dirEntry of await fs.opendir(dir)) {
        const entryPath = p.join(dir, dirEntry.name);
        if (dirEntry.isDirectory()) {
            walkFile(entryPath);
        } else {
            callback(entryPath, dirEntry.name);
        }
    }
}
/** @param {string} path */
async function toMetadata(path) {
    const f = await fs.open(path);
    const metas = [];
    let isMeta = false;
    for await (const line of f.readLines()) {
        if (!isMeta) {
            if (line === '// ==UserScript==') {
                isMeta = true;
                metas.push(line);
            }
        } else if (line === '// ==/UserScript==') {
            metas.push(line);
            f.close();
            return metas.join('\n');
        } else if (/^\/\/ @require/.test(line)) {
            const newLine = line.replaceAll(
                'https://github.com/Cubxx/tampermonkey-script/raw/main',
                workspaceURL,
            );
            metas.push(newLine);
        } else if (/^\/\/ @updateURL/.test(line)) {
            const newLine = line
                .replaceAll('// @updateURL', '// @require  ')
                .replaceAll(
                    'https://github.com/Cubxx/tampermonkey-script/raw/main',
                    workspaceURL,
                );
            metas.push(newLine);
        } else if (/^\/\/ @downloadURL/.test(line)) {
        } else {
            metas.push(line);
        }
    }
    throw "Can't get metadata: " + path;
}
/** @param {string} name @param {string} newText */
async function updateFile(name, newText) {
    const path = p.join(dest, name);
    const oldText = await fs.access(path).then(
        () => fs.readFile(path, 'utf-8'),
        () => '',
    );
    if (oldText !== newText) {
        fs.writeFile(path, newText, 'utf-8');
        exec('start msedge ' + p.join(workspaceURL, dest, name));
        console.log('Update: ' + path);
    } else {
        console.log('No changes: ' + path);
    }
}

const workspaceURL = 'file:///' + process.cwd().replaceAll(p.sep, '/');
const src = 'src';
const dest = 'local';
fs.mkdir(dest, { recursive: true });
walkFile(src, (path, name) => {
    toMetadata(path)
        .then((data) => updateFile(name, data), console.log)
        .catch((e) => {
            console.error(e);
            debugger;
        });
});
