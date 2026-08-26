#!/usr/bin/env node

import fs from 'fs'

const home = process.env.home
const repo = process.env.repo
const processName = process.env.process

const partsBase = `${home}/${repo}/${processName}/src/parts`
const pagePartsBase = `${home}/${repo}/${processName}/src/pageParts`
const srcBase = `${home}/${repo}/${processName}/src`

const getDirs = base => fs.readdirSync(base, {
    withFileTypes: true,
}).filter(entry =>
    entry.isDirectory()
).map(entry => entry.name)

const aliases = {
    core: './src/core/exports',
    richTextComponents: './src/richTextComponents',
    itemRendererComponents: './src/itemRendererComponents',
    loaders: './src/loaders',
    paginationBehaviors: './src/paginationBehaviors',
}

const srcDirectories = getDirs(srcBase)

for (const dir of srcDirectories) {
    if (dir === 'getters') {
        aliases.getters = './src/getters/exports'
    }
    if (dir === 'functions') {
        aliases.functions = './src/functions/exports'
    }
}

const parts = getDirs(partsBase)

for (const part of parts) {
    aliases[part] = `./src/parts/${part}/exports`
}

const pagePartsFiles = fs.readdirSync(pagePartsBase).filter(f =>
    f.endsWith('Exports.jsx')
    || f.endsWith('Exports.ts')
    || f.endsWith('Exports.tsx')
)

for (const file of pagePartsFiles) {
    const key = file.replace(/Exports\.[^/.]+$/, '')

    if (!fs.existsSync(`${pagePartsBase}/${key}`)) {
        fs.unlinkSync(`${pagePartsBase}/${file}`)
        continue
    }

    aliases[key] = `./src/pageParts/${file.replace(/\.[^/.]+$/, '')}`
}

const sortedAliases = Object.fromEntries(
    Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b))
)

const tsConfig = {
    compilerOptions: {
        paths: Object.fromEntries(
            Object.entries(sortedAliases).map(([key, value]) => [
                key,
                [value],
            ]),
        ),
    },
    extends: './coreTsConfig',
}

const tsConfigContent = JSON.stringify(tsConfig, null, 4) + '\n'

const tsConfigFilePath = `${home}/${repo}/${processName}/tsconfig.json`

if (
    !fs.existsSync(tsConfigFilePath)
    || fs.readFileSync(tsConfigFilePath, 'utf8') !== tsConfigContent
) {
    fs.writeFileSync(tsConfigFilePath, tsConfigContent)
}
