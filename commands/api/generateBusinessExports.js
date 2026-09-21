#!/usr/bin/env node

import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
} from 'fs'
import path from 'path'
import fg from 'fast-glob'

const [, , ...parts] = process.argv
const {
    containerHome,
    process: proc,
    repo,
} = process.env

const nodeModules = `${containerHome}/${repo}/${proc}/node_modules`
const hasDefaultExport = file => /\bexport\s+default\b/.test(readFileSync(file, 'utf8'))
const capitalize = value => `${value[0].toUpperCase()}${value.slice(1)}`
const getQualifiedName = relativePath => relativePath
    .replace(/\.js$/, '')
    .split('/')
    .map((segment, index) => index ? capitalize(segment) : segment)
    .join('')

for (const part of parts) {
    const businessRoot = `${nodeModules}/${part}/business`
    if (!existsSync(businessRoot)) continue
    const files = await fg('**/*.js', {
        absolute: true,
        cwd: businessRoot,
        ignore: [
            '**/aggregates/**',
            '**/*Test.js',
            '**/runTests.js',
        ],
    })
    const names = files.reduce((result, file) => {
        const name = path.basename(file, '.js')
        result.set(name, (result.get(name) || 0) + 1)
        return result
    }, new Map())
    const lines = files.sort().flatMap(file => {
        const relativePath = path.relative(businessRoot, file)
        const name = path.basename(file, '.js')
        const exportedName = names.get(name) === 1
            ?
            name
            :
            getQualifiedName(relativePath)
        const exports = [`export * from '${file}'`]
        if (hasDefaultExport(file)) {
            exports.push(`export { default as ${exportedName} } from '${file}'`)
        }
        return exports
    })
    const packageDirectory = `${nodeModules}/${part}Business`
    const packageData = {
        main: 'exports.js',
        type: 'module',
    }
    mkdirSync(packageDirectory, { recursive: true })
    writeFileSync(`${packageDirectory}/exports.js`, `${lines.join('\n')}\n`)
    writeFileSync(`${packageDirectory}/package.json`, JSON.stringify(packageData, null, 4))
}
