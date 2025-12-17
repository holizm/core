#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const repo = process.argv[2]
const process = process.argv[3]

const getDirectoryFiles = dir =>
    fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isFile())

const getApplicationParts = () =>
    fs.readdirSync(`/${repo}/${process}/src/applicationParts`)

const getPageParts = () =>
    fs.readdirSync(`/${repo}/${process}/src/pageParts`)

const getSrcDirectories = () =>
    fs.readdirSync(`/${repo}/${process}/src`)


const aliases = {
    qwik: 'node_modules/@builder.io/qwik',
    qwikCity: 'node_modules/@builder.io/qwik-city',
    base: 'src/base/exports',
    richTextComponents: 'src/richTextComponents',
    entityRendererComponents: 'src/itemRendererComponents',
    loaders: 'src/loaders',
    paginationBehaviors: 'src/paginationBehaviors'
}

const applicationParts = getApplicationParts()
const pageParts = getPageParts()
const srcDirectories = getSrcDirectories()

for (const srcDirectory of srcDirectories) {
    if (srcDirectory === 'getters') {
        aliases.getters = 'src/getters/exports'
    }
    if (srcDirectory === 'functions') {
        aliases.functions = 'src/functions/exports'
    }
}

for (const applicationPart of applicationParts) {
    aliases[applicationPart] = `src/applicationParts/${applicationPart}/exports`
}

for (const pagePart of pageParts) {
    aliases[pagePart] = `src/pageParts/${pagePart}/exports`
}

const sortedAliases = Object.fromEntries(
    Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b))
)

let tsConfigContent = `{
    "extends": "./tsConfigBase",
    "compilerOptions": {
        "paths": {
`

const aliasKeys = Object.keys(sortedAliases)
const lastAliasKey = aliasKeys[aliasKeys.length - 1]

for (const aliasKey of aliasKeys) {
    tsConfigContent += `            "${aliasKey}": [
                "${sortedAliases[aliasKey]}"
            ]${aliasKey === lastAliasKey ? '' : ','}
`
}

tsConfigContent += `        }
    }
}
`

const tsConfigFilePath = `/${repo}/${process}/tsconfig.json`

if (fs.existsSync(tsConfigFilePath)) {
    const existingContent = fs.readFileSync(tsConfigFilePath, 'utf8')
    if (existingContent !== tsConfigContent) {
        fs.writeFileSync(tsConfigFilePath, tsConfigContent)
    }
} else {
    fs.writeFileSync(tsConfigFilePath, tsConfigContent)
}

return aliases
