#!/usr/bin/env node

import fs from 'fs'

const home = process.env.home
const repo = process.env.repo
const proc = process.env.process

const partsBase = `${home}/${repo}/${proc}/src/parts`
const pagePartsBase = `${home}/${repo}/${proc}/src/pageParts`
const srcBase = `${home}/${repo}/${proc}/src`

const getDirs = base =>
    fs.readdirSync(base).filter(d =>
        fs.statSync(`${base}/${d}`).isDirectory()
    )

const aliases = {
    qwik: 'node_modules/@builder.io/qwik',
    qwikCity: 'node_modules/@builder.io/qwik-city',
    core: 'src/core/exports',
    richTextComponents: 'src/richTextComponents',
    itemRendererComponents: 'src/itemRendererComponents',
    loaders: 'src/loaders',
    paginationBehaviors: 'src/paginationBehaviors'
}

const srcDirectories = getDirs(srcBase)

for (const dir of srcDirectories) {
    if (dir === 'getters') {
        aliases.getters = 'src/getters/exports'
    }
    if (dir === 'functions') {
        aliases.functions = 'src/functions/exports'
    }
}

const parts = getDirs(partsBase)

for (const part of parts) {
    aliases[part] = `src/parts/${part}/exports`
}

const pagePartsFiles = fs.readdirSync(pagePartsBase).filter(f =>
    f.endsWith('Exports.jsx')
    || f.endsWith('Exports.ts')
    || f.endsWith('Exports.tsx')
)

for (const file of pagePartsFiles) {
    const key = file.replace(/Exports\.[^/.]+$/, '')
    aliases[key] = `src/pageParts/${file.replace(/\.[^/.]+$/, '')}`
}

const sortedAliases = Object.fromEntries(
    Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b))
)

const tsConfig = {
    extends: './coreTsConfig',
    compilerOptions: {
        paths: Object.fromEntries(
            Object.entries(sortedAliases).map(([key, value]) => [
                key,
                [value]
            ])
        )
    }
}

const tsConfigContent = JSON.stringify(tsConfig, null, 4)

const tsConfigFilePath = `${home}/${repo}/${proc}/tsconfig.json`

if (
    !fs.existsSync(tsConfigFilePath)
    || fs.readFileSync(tsConfigFilePath, 'utf8') !== tsConfigContent
) {
    fs.writeFileSync(tsConfigFilePath, tsConfigContent)
}
