#!/usr/bin/env node

import path from 'path'
import fg from 'fast-glob'
import {
    init,
    parse,
} from 'es-module-lexer'
import {
    exists,
    getContent,
    writeFile,
} from '../../scripts/os.js'

const [, , ...parts] = process.argv
const {
    containerHome,
    process: proc,
    repo,
} = process.env

const nodeModules = `${containerHome}/${repo}/${proc}/node_modules`
const capitalize = value => `${value[0].toUpperCase()}${value.slice(1)}`
const getQualifiedName = relativePath => relativePath
    .replace(/\.js$/, '')
    .split('/')
    .map((segment, index) => index ? capitalize(segment) : segment)
    .join('')
const getExportedName = ({
    exportName,
    file,
    names,
    root,
}) => {
    if (names.get(exportName) === 1) return exportName

    const relativePath = path.relative(root, file)
    const qualifiedName = getQualifiedName(relativePath)
    const fileName = path.basename(file, '.js')
    return exportName === fileName
        ?
        qualifiedName
        :
        `${qualifiedName}${capitalize(exportName)}`
}

await init

for (const part of parts) {
    const businessRoot = `${nodeModules}/${part}/business`
    if (!exists(businessRoot)) continue
    const files = await fg('**/*.js', {
        absolute: true,
        cwd: businessRoot,
        ignore: [
            '**/aggregates/**',
            '**/*Test.js',
            '**/*Tests.js',
            '**/testing/**',
            '**/integrationTests/**',
            '**/runTests.js',
        ],
    })
    const modules = files.sort().map(file => {
        const [, exports] = parse(getContent(file))
        const moduleData = {
            exportNames: exports
                .map(item => item.name ?? item.n)
                .filter(Boolean),
            file,
        }
        return moduleData
    })
    const names = modules.reduce((result, moduleData) => {
        for (const exportName of moduleData.exportNames) {
            const name = exportName === 'default'
                ?
                path.basename(moduleData.file, '.js')
                :
                exportName
            result.set(name, (result.get(name) || 0) + 1)
        }
        return result
    }, new Map())
    const packageDirectory = `${nodeModules}/${part}Business`
    const lines = modules.flatMap(moduleData => {
        const fileName = path.basename(moduleData.file, '.js')
        return moduleData.exportNames.map(name => {
            const exportName = name === 'default' ? fileName : name
            const exportedName = getExportedName({
                exportName,
                file: moduleData.file,
                names,
                root: businessRoot,
            })
            const modulePath = path.relative(packageDirectory, moduleData.file)
            return `export { ${name} as ${exportedName} } from '${modulePath}'`
        })
    })
    const packageData = {
        main: 'exports.js',
        type: 'module',
    }
    writeFile(`${packageDirectory}/exports.js`, `${lines.join('\n')}\n`)
    writeFile(`${packageDirectory}/package.json`, JSON.stringify(packageData, null, 4))
}
