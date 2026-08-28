#!/usr/bin/env node

import { warning } from '../../scripts/logger.js'
import { writeFile } from '../../scripts/os.js'
import { runOnTerminal } from '../../scripts/terminal.js'

const [, , ...directories] = process.argv
const {
    containerHome,
    home,
    process: proc,
    repo,
} = process.env

const nodeModules = `${containerHome}/${repo}/${proc}/node_modules`

const getFiles = async root => {
    const command = `find ${root} -mindepth 2 -type f -name '*.js' ! -path '*/business/*/aggregates/*' ! -name '*Test.js' ! -name 'runTests.js'`
    const files = runOnTerminal(command)
        .split('\n')
        .filter(Boolean)
    return files
}

for (const directory of directories) {
    const root = `${nodeModules}/${directory}`
    const exportsFilePath = `${root}/exports.js`
    const files = await getFiles(root)
    if (files.some(file => !file)) {
        warning(root, files)
    }
    const exports = files.map(file => `export * from '${file}'`).join('\n')
    writeFile(exportsFilePath, exports)
}
