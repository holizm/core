#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import camelize from '../../scripts/camelize.js'
import pascalize from '../../scripts/pascalize.js'

const topLevelDirectory = process.argv[2]
const target = process.argv[3]
const home = process.env.home
const repo = process.env.repo
const processName = process.env.process

if (!topLevelDirectory || !['pageParts', 'parts'].includes(target)) {
    process.exit(1)
}

const baseDirectory = `${home}/${repo}/${processName}/src/${target}`
const sourceDirectory = path.join(baseDirectory, topLevelDirectory)
const exportsPath = target === 'parts'
    ?
    path.join(sourceDirectory, 'exports.jsx')
    :
    path.join(baseDirectory, `${topLevelDirectory}Exports.jsx`)

if (!fs.existsSync(sourceDirectory)) {
    if (target === 'pageParts' && fs.existsSync(exportsPath)) {
        fs.unlinkSync(exportsPath)
    }

    process.exit(0)
}

const findFiles = directory => fs.readdirSync(directory, {
    withFileTypes: true,
}).flatMap(entry => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
        return findFiles(entryPath)
    }

    if (
        !entry.isFile()
        || !entry.name.endsWith('.jsx')
        || entry.name === 'exports.jsx'
        || entry.name.endsWith('Exports.jsx')
    ) {
        return []
    }

    return [entryPath]
})

const importExportData = findFiles(sourceDirectory).filter(fullPath => {
    if (target !== 'parts') {
        return true
    }

    const segments = path.relative(sourceDirectory, fullPath).split(path.sep)

    return segments[0] !== 'parts' || segments.length <= 3
}).map(fullPath => {
    const rawName = path.basename(fullPath, '.jsx')
    const relativePath = target === 'pageParts'
        ?
        path.relative(baseDirectory, fullPath)
        :
        path.relative(sourceDirectory, fullPath)
    const isComponent = target === 'pageParts'
        || fullPath.split('/parts/').length === 3
    const nameSegments = relativePath
        .replace(/\.jsx$/, '')
        .split(path.sep)
    const componentNameSegments = target === 'parts'
        ?
        nameSegments.slice(1)
        :
        nameSegments
    const name = isComponent
        ?
        componentNameSegments.map(pascalize).join('')
        :
        camelize(rawName)
    const importPath = `./${relativePath.replace(/\.jsx$/, '').split(path.sep).join('/')}`

    return {
        exportLine: `export { ${name} }\n`,
        importLine: `import ${name} from '${importPath}'\n`,
        name,
    }
})

if (!importExportData.some(item => item.name === 'Layout')) {
    importExportData.push({
        exportLine: 'export { Layout }\n',
        importLine: 'const Layout = null\n',
        name: 'Layout',
    })
}

importExportData.sort((first, second) =>
    first.name.localeCompare(second.name)
)

const imports = importExportData.map(item => item.importLine).join('')
const exports = importExportData.map(item => item.exportLine).join('')
const content = `${imports}\n${exports}`

if (
    fs.existsSync(exportsPath)
    && fs.readFileSync(exportsPath, 'utf8') === content
) {
    process.exit(0)
}

const temporaryPath = `${exportsPath}.temporary`

fs.writeFileSync(temporaryPath, content)
fs.renameSync(temporaryPath, exportsPath)
