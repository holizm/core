#!/usr/bin/env node

import { writeFileSync } from 'fs'
import { runOnTerminal } from '../../scripts/terminal.js'

const [, , ...directories] = process.argv
const {
    home,
    process: proc,
    repo,
} = process.env

const nodeModules = `${home}/${repo}/${proc}/node_modules`

const getImportedParts = directory => {
    try {
        const command = `grep -r --include="*.js" -h "import " "${directory}" | sed -E "s/.*from ['\\\"]([^'\\\"]+)['\\\"].*/\\1/" | sort | uniq`
        const output = runOnTerminal(command)

        return output
            .split('\n')
            .filter(importedPart => importedPart)
            .map(importedPart => importedPart.trim())
            .reduce((acc, item) => {
                acc[item] = `file:../${item}`
                return acc
            }, {})
    } catch (err) {
        console.error(err)
        return {}
    }
}

for (let i = 0; i < directories.length; i++) {
    const directory = directories[i]
    const packageFilePath = `${nodeModules}/${directory}/package.json`
    const importedParts = getImportedParts(directory)

    const content = {
        type: 'module',
        main: 'exports.js',
        dependencies: importedParts
    }

    writeFileSync(packageFilePath, JSON.stringify(content, null, 4))
}
