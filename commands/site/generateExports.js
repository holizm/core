#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import camelize from '../../scripts/camelize.js'
import pascalize from '../../scripts/pascalize.js'

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

if (exportsPath.includes('/pageParts/Exports.jsx')) process.exit()

const foundFiles = execSync(`find "${sourceDir}" -type f -name "*.jsx"`)
    .toString()
    .trim()
    .split('\n')

const importExportData = foundFiles
    .filter(f => !f.endsWith('/exports.jsx') && !f.endsWith('Exports.jsx'))
    .map(fullPath => {
        const rawName = path.basename(fullPath).replace('.jsx', '')
        const isComponent = fullPath.split('/parts/').length === 3 || target === 'pageParts'
        const name = isComponent ? pascalize(rawName) : camelize(rawName)
        const importPath = `./${path.relative(sourceDir, fullPath).replace('.jsx', '')}`
        return { name, importLine: `import ${name} from "${importPath}"\n`, exportLine: `export { ${name} }\n` }
    })

importExportData.sort((a, b) => a.name.localeCompare(b.name))

const imports = importExportData.map(i => i.importLine).join('')
const exports = importExportData.map(i => i.exportLine).join('')

const content = `${imports}\n${exports}`

if (fs.existsSync(exportsPath)) {
    if (fs.readFileSync(exportsPath, 'utf8') === content) process.exit(0)
}

fs.writeFileSync(exportsPath, content)
