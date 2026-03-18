#!/usr/bin/env node

import { runOnTerminal } from '../../scripts/terminal.js'
import { writeFile } from '../../scripts/os.js'
import { warning } from '../../scripts/logger.js'

const [, , ...directories] = process.argv
const {
    home,
    process: proc,
    repo,
} = process.env

const nodeModules = `${home}/${repo}/${proc}/node_modules`

const getFiles = async root => {
    const command = `find ${root} -mindepth 2 -type f -name '*.js'`
    const files = runOnTerminal(command).split('\n')
    return files
}

for (let i = 0; i < directories.length; i++) {
    const directory = directories[i];
    const root = `${nodeModules}/${directory}`
    const exportsFilePath = `${root}/exports.js`
    const files = await getFiles(root)
    if (files.some(i => !i)) {
        warning(root, files)
    }
    const exports = files.map(i => `export * from '${i}'`).join('\n')
    writeFile(exportsFilePath, exports)
}
