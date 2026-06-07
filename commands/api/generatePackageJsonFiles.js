#!/usr/bin/env node

import { writeFileSync } from 'fs'
import fs from 'fs/promises'
import fg from 'fast-glob'
import { init, parse } from 'es-module-lexer'

const [, , ...directories] = process.argv

const {
    containerHome,
    process: proc,
    repo,
} = process.env

const nodeModules = `${containerHome}/${repo}/${proc}/node_modules`

const getImportedParts = async dir => {
    await init

    const files = await fg('**/*.js', {
        cwd: dir,
        absolute: true,
        dot: false,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    })

    const imports = new Set()

    await Promise.allSettled(
        files.map(async file => {
            const code = await fs.readFile(file, 'utf8')
            const [modules] = parse(code)
            for (const m of modules) if (m.n) imports.add(m.n)
        })
    )

    return [...imports].sort()
}

for (const directory of directories) {
    const packageFilePath = `${nodeModules}/${directory}/package.json`

    const importedParts = await getImportedParts(directory)

    const content = {
        type: 'module',
        main: 'exports.js',
        dependencies: importedParts
    }

    writeFileSync(packageFilePath, JSON.stringify(content, null, 4))
}
