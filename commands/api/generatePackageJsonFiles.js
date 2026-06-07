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

const isRelative = m => m.startsWith('.')
const isAbsolute = m => m.startsWith('/')
const getPackageName = m => {
    const parts = m.split('/')
    if (m.startsWith('@')) return parts.slice(0, 2).join('/')
    return parts[0]
}

const getImportedParts = async dir => {
    await init
    const base = `${nodeModules}/${dir}`
    const files = await fg('**/*.js', {
        cwd: base,
        absolute: true,
        dot: false,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    })
    const imports = new Set()
    await Promise.allSettled(
        files.map(async file => {
            const code = await fs.readFile(file, 'utf8')
            const [modules] = parse(code)
            for (const m of modules) {
                if (!m.n) continue
                const spec = m.n
                if (isRelative(spec) || isAbsolute(spec)) continue
                imports.add(getPackageName(spec))
            }
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
