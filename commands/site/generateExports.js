#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const topLevelDir = process.argv[2]
const target = process.argv[3]

const repo = process.env.repo
const processName = process.env.process

const baseDir = `/${repo}/${processName}/src/${target}`
const sourceDir = path.join(baseDir, topLevelDir)

const exportsPath =
    target === 'parts'
        ? path.join(sourceDir, 'exports.jsx')
        : path.join(baseDir, `${topLevelDir}Exports.jsx`)


if (exportsPath.includes("/pageParts/Exports.jsx")) {
    process.exit()
}

const files = fs.readdirSync(sourceDir).filter(f =>
    f.endsWith('.jsx') &&
    fs.statSync(path.join(sourceDir, f)).isFile()
)

const imports = files
    .filter(f => f !== 'exports.jsx' && !f.endsWith('Exports.jsx'))
    .map(f => {
        const name = f.replace('.jsx', '')
        const importPath =
            target === 'parts'
                ? `./${name}`
                : `./${topLevelDir}/${name}`
        return `import ${name} from "${importPath}"\n`
    })
    .sort()
    .join('')

const exports = files
    .filter(f => f !== 'exports.jsx' && !f.endsWith('Exports.jsx'))
    .map(f => {
        const name = f.replace('.jsx', '')
        return `export { ${name} }\n`
    })
    .sort()
    .join('')

const content = `${imports}\n${exports}`

if (fs.existsSync(exportsPath)) {
    if (fs.readFileSync(exportsPath, 'utf8') === content) process.exit(0)
}

fs.writeFileSync(exportsPath, content)
