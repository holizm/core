import assert from 'assert/strict'
import fs from 'fs'
import os from 'os'
import path from 'path'
import test from 'node:test'
import findThemeDirectories from './findThemeDirectories.js'

test('findThemeDirectories finds and numerically orders theme directories', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'themeDirectories'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    for (const name of ['theme10', 'theme2', 'theme01', 'themes3', 'themeA']) {
        fs.mkdirSync(path.join(root, name))
    }
    fs.writeFileSync(path.join(root, 'theme3'), '')
    assert.deepEqual(findThemeDirectories(root), ['theme01', 'theme2', 'theme10'])
})

test('only listed core themes are discovered alongside local themes', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coreThemes'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    const runnable = path.join(root, 'sampleThemes')
    const catalog = path.join(root, 'siteThemes')
    fs.mkdirSync(path.join(runnable, 'theme001'), { recursive: true })
    fs.mkdirSync(path.join(catalog, 'theme001'), { recursive: true })
    fs.mkdirSync(path.join(catalog, 'theme032'))
    fs.mkdirSync(path.join(catalog, 'theme100'))
    fs.mkdirSync(path.join(catalog, 'other'))
    const selection = path.join(runnable, 'coreThemes')
    fs.writeFileSync(selection, 'theme100\n theme001 \n\ntheme100\n')
    assert.deepEqual(findThemeDirectories(runnable, catalog, selection), [
        '../siteThemes/theme001',
        '../siteThemes/theme100',
        'theme001',
    ])
    assert.deepEqual(findThemeDirectories(runnable, catalog, path.join(runnable, 'missing')), ['theme001'])
})

test('missing and invalid selections never fall back to the core catalog', t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'coreOnlyThemes'))
    t.after(() => fs.rmSync(root, {
        force: true,
        recursive: true,
    }))
    const runnable = path.join(root, 'sampleThemes')
    const catalog = path.join(root, 'siteThemes')
    fs.mkdirSync(runnable)
    fs.mkdirSync(path.join(catalog, 'theme032'), { recursive: true })
    fs.symlinkSync('../siteThemes/theme032', path.join(runnable, 'coreTheme032'))
    const selection = path.join(runnable, 'coreThemes')
    assert.deepEqual(findThemeDirectories(runnable, catalog, selection), [])
    fs.writeFileSync(selection, 'theme033\n')
    assert.throws(() => findThemeDirectories(runnable, catalog, selection), /Unknown core theme 'theme033'/)
})
