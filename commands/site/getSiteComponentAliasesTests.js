import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import getSiteComponentAliases from './getSiteComponentAliases.js'

test('getSiteComponentAliases maps core and page components to generated barrels', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'getSiteComponentAliases'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const coreDirectory = path.join(directory, 'coreFunctions')
    const pageDirectory = path.join(directory, 'pageParts', 'home')
    fs.mkdirSync(coreDirectory, { recursive: true })
    fs.mkdirSync(pageDirectory, { recursive: true })
    fs.writeFileSync(path.join(coreDirectory, 'sample.js'), 'export default value => value\n')
    fs.writeFileSync(path.join(pageDirectory, 'title.jsx'), `export default () => 'Title'\n`)
    const aliases = getSiteComponentAliases(directory, true)
    assert.equal(aliases.coreSample, path.join(directory, 'coreBarrels', 'coreFunctions', 'sample'))
    assert.equal(aliases.homeTitle, path.join(directory, 'coreBarrels', 'pageParts', 'home', 'title'))
    assert.match(fs.readFileSync(path.join(directory, 'coreBarrels', 'coreFunctions', 'sample.js'), 'utf8'), /export \{ default \}/)
})

test('theme JSON fixtures receive direct per-file aliases without JavaScript in JSON barrels', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'siteDataAlias'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    const folder = path.join(directory, 'themes', '03', 'data')
    fs.mkdirSync(folder, { recursive: true })
    const file = path.join(folder, 'home.json')
    fs.writeFileSync(file, '{"header":{}}')
    const aliases = getSiteComponentAliases(directory, true)
    assert.equal(aliases.theme03DataHome, file)
    assert.equal(fs.existsSync(path.join(directory, 'coreBarrels', 'themes', '03', 'data', 'home.json')), false)
})

test('named core functions have default-compatible per-function aliases', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'siteNamedAlias'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    fs.mkdirSync(path.join(directory, 'core'))
    fs.writeFileSync(path.join(directory, 'core', 'cache.js'), `export const getValue = () => 'Loaded'\n`)
    const aliases = getSiteComponentAliases(directory, true)
    const module = await import(`${aliases.getValue}.js`)
    assert.equal(module.default(), 'Loaded')
})

test('a named export matching its filename also supports default imports', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'namedFileAlias'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    fs.mkdirSync(path.join(directory, 'core'))
    fs.writeFileSync(path.join(directory, 'core', 'namedValue.js'), 'export const namedValue = 7\n')
    const aliases = getSiteComponentAliases(directory, true)
    const module = await import(`${aliases.namedValue}.js`)
    assert.equal(module.default, 7)
})

test('scoped filename aliases also retain named-export default compatibility', async t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'scopedNamedAlias'))
    t.after(() => fs.rmSync(directory, { force: true, recursive: true }))
    fs.mkdirSync(path.join(directory, 'coreFunctions'))
    fs.writeFileSync(path.join(directory, 'coreFunctions', 'namedValue.js'), 'export const namedValue = 7\n')
    const aliases = getSiteComponentAliases(directory, true)
    const module = await import(`${aliases.coreFunctionsNamedValue}.js`)
    assert.equal(module.default, 7)
})
