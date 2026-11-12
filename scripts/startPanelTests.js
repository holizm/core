import assert from 'assert/strict'
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import test from 'node:test'
import { mapDependencies } from './startPanel.js'

test('panel startup does not recreate an optional settings override from a template', () => {
    const source = readFileSync(new URL('./startPanel.js', import.meta.url), 'utf8')
    assert.doesNotMatch(source, /copyFileIfNotExists\([^\n]*settingsOverride/)
})

test('admin composition includes only implemented admin roles and keeps common modules', () => {
    const home = mkdtempSync(join(tmpdir(), 'panelRoleComposition'))
    const repo = `panelRole${process.pid}`
    const target = `/tmp/${repo}`
    const volumes = []
    try {
        for (const directory of ['catalog/panel/admin', 'messages/panel/common', 'messages/panel/user']) {
            mkdirSync(join(home, directory), { recursive: true })
        }
        for (const dependency of ['catalog', 'messages']) writeFileSync(join(home, dependency, 'part'), dependency)
        mkdirSync(`${target}/adminPanel`, { recursive: true })
        mapDependencies({
            addVolume: (source, destination) => volumes.push([source, destination]),
            containerHome: home,
            dependencies: ['catalog', 'messages'],
            home,
            process: 'adminPanel',
            repo,
        })
        assert.ok(volumes.some(([source]) => source === `${home}/catalog/panel/admin`))
        assert.ok(volumes.some(([source]) => source === `${home}/messages/panel/common`))
        assert.ok(!volumes.some(([source]) => source === `${home}/messages/panel/admin`))
    } finally {
        rmSync(home, {
            force: true,
            recursive: true,
        })
        rmSync(target, {
            force: true,
            recursive: true,
        })
    }
})
