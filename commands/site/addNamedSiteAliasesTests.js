import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import addNamedSiteAliases from './addNamedSiteAliases.js'

test('named aliases retain the first implementation when another barrel re-exports it', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'namedSiteAliases'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    fs.mkdirSync(path.join(directory, 'core'))
    fs.writeFileSync(path.join(directory, 'core', 'first.js'), `export const getValue = () => 'First'\n`)
    fs.writeFileSync(path.join(directory, 'core', 'second.js'), `export const getValue = () => 'Second'\n`)
    const aliases = {}
    addNamedSiteAliases({
        absolute: true,
        aliases,
        namedAliases: [['getValue', 'core/first.js'], ['getValue', 'core/second.js']],
        srcBase: directory,
    })
    const module = await import(`${aliases.getValue}.js`)
    assert.equal(module.default(), 'First')
    assert.equal(aliases.coreGetValue, aliases.getValue)
})

test('a selected part keeps its public name while the core alias remains available', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'namedAliasShadow'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    fs.mkdirSync(path.join(directory, 'parts', 'getValue'), { recursive: true })
    const aliases = {}
    addNamedSiteAliases({
        absolute: true,
        aliases,
        namedAliases: [['getValue', 'core/value.js']],
        srcBase: directory,
    })
    assert.equal(aliases.getValue, undefined)
    assert.ok(aliases.coreGetValue)
})
