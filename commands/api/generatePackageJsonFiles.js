#!/usr/bin/env node

import util from 'util'
import { exec } from 'child_process'
import { writeFileSync } from 'fs'

const promisifiedExec = util.promisify(exec)
const [, , ...directories] = process.argv
const {
    process: proc,
    repo,
} = process.env

const nodeModules = `/${repo}/${proc}/node_modules`

const getImportedParts = async directory => {
    try {
        const command = `grep -r --include="*.js" -h "import " "${directory}" | sed -E "s/.*from ['\\\"]([^'\\\"]+)['\\\"].*/\\1/" | sort | uniq`
        const { stdout, stderr } = await promisifiedExec(command)
        if (stderr) {
            console.log('stderr:', stderr, command)
            return []
        }
        return stdout
            .split('\n')
            .filter(importedPart => importedPart)
            .map(importedPart => importedPart.trim())
            .reduce((acc, item) => {
                acc[item] = `file:../${item}`
                return acc
            }, {})
    } catch (err) {
        console.error(err)
        return ''
    }
}

for (let i = 0; i < directories.length; i++) {
    const directory = directories[i]
    const packageFilePath = `${nodeModules}/${directory}/package.json`
    const importedParts = await getImportedParts(directory)
    const content = {
        type: 'module',
        main: 'exports.js',
        dependencies: importedParts
    }
    writeFileSync(packageFilePath, JSON.stringify(content, null, 4))
}
