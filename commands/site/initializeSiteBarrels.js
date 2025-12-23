#!/usr/bin/env node

import fs from 'fs'

const repo = process.env.repo
const proc = process.env.process

const partsBase = `/${repo}/${proc}/src/parts`
const pagePartsBase = `/${repo}/${proc}/src/pageParts`
const srcBase = `/${repo}/${proc}/src`

const getDirs = base =>
    fs.readdirSync(base).filter(d =>
        fs.statSync(`${base}/${d}`).isDirectory()
    )

const aliases = {
    qwik: 'node_modules/@builder.io/qwik',
    qwikCity: 'node_modules/@builder.io/qwik-city',
    core: 'src/core/exports',
    richTextComponents: 'src/richTextComponents',
    entityRendererComponents: 'src/itemRendererComponents',
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

const pageParts = getDirs(pagePartsBase)
for (const pagePart of pageParts) {
    aliases[pagePart] = `src/pageParts/${pagePart}Exports`
}

const sortedAliases = Object.fromEntries(
    Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b))
)

let tsConfigContent = `{
    "extends": "./coreTsConfig",
    "compilerOptions": {
        "paths": {
`

const keys = Object.keys(sortedAliases)
const lastKey = keys[keys.length - 1]

for (const key of keys) {
    tsConfigContent += `            "${key}": [
                "${sortedAliases[key]}"
            ]${key === lastKey ? '' : ','}
`
}

tsConfigContent += `        }
    }
}
`

const tsConfigFilePath = `/${repo}/${proc}/tsconfig.json`

if (fs.existsSync(tsConfigFilePath)) {
    if (fs.r
